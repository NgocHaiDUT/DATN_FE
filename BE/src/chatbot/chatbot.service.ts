import { ResponseMessages } from '../common/constants/messages.constant';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import OpenAI from 'openai';
import { PrismaService } from '../prisma/prisma.service';
import { ChatDto } from './dto/chat.dto';

type ChatbotSessionRecord = {
  id: number;
  user_id: number | null;
  coze_conversation_id: string | null;
  title: string | null;
};

type ProductSearchArgs = {
  query?: string;
  shopId?: number;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
};

type ProductSearchResult = {
  query: string;
  count: number;
  products: Array<{
    id: number;
    name: string;
    slug: string;
    url: string;
    price_from: number | null;
    brand: { id: number; name: string; slug: string } | null;
    shop: { id: number; name: string; slug: string };
  }>;
};

@Injectable()
export class ChatbotService {
  private readonly client: OpenAI;
  private readonly model = process.env.OPENAI_CHATBOT_MODEL || 'gpt-4.1-mini';
  private readonly configuredAssistantId = process.env.OPENAI_ASSISTANT_ID;
  private readonly frontendUrl = (
    process.env.FRONTEND_URL || 'http://localhost:3001'
  ).replace(/\/$/, '');
  private readonly backendUrl = (
    process.env.BACKEND_URL || 'http://localhost:3000'
  ).replace(/\/$/, '');
  private cachedAssistantId: string | null = null;
  private configuredAssistantSynced = false;

  constructor(private readonly prisma: PrismaService) {
    if (!process.env.OPENAI_API_KEY) {
      // Delay throwing until sendMessage so the module can still boot in environments
      // that do not use chatbot features.
      this.client = null as unknown as OpenAI;
      return;
    }
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async sendMessage(dto: ChatDto, userId: number) {
    if (!process.env.OPENAI_API_KEY) {
      throw new HttpException(
        'Thieu cau hinh OPENAI_API_KEY',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const assistantId = await this.ensureAssistant();
    const session = await this.getOrCreateSession(dto, userId);
    const threadId = await this.getOrCreateThread(session);

    await this.prisma.chatbot_messages.create({
      data: {
        session_id: session.id,
        sender: 'user',
        content: dto.message,
      },
    });

    try {
      await this.client.beta.threads.messages.create(threadId, {
        role: 'user',
        content: dto.message,
      });

      let run = await this.client.beta.threads.runs.create(threadId, {
        assistant_id: assistantId,
        additional_instructions: [
          `Current user id: ${userId}.`,
          dto.shopId
            ? `Only recommend products from shop id ${dto.shopId} unless the user asks more broadly.`
            : '',
          `Product URLs must use this storefront base URL: ${this.frontendUrl}.`,
        ]
          .filter(Boolean)
          .join('\n'),
      });

      const productSearchResults: ProductSearchResult[] = [];
      run = await this.waitForRun(
        threadId,
        run.id,
        dto.shopId,
        productSearchResults,
      );
      if (run.status !== 'completed') {
        throw new Error(`Assistant run did not complete: ${run.status}`);
      }

      const assistantText = await this.getLatestAssistantText(threadId);
      const botText = await this.ensureProductLinks(
        assistantText,
        dto.message,
        dto.shopId,
        productSearchResults,
      );

      await this.prisma.chatbot_messages.create({
        data: {
          session_id: session.id,
          sender: 'bot',
          content: botText,
        },
      });

      await this.prisma.chatbot_sessions.update({
        where: { id: session.id },
        data: { updated_at: new Date() },
      });

      return {
        sessionId: session.id,
        cozeConversationId: threadId,
        openaiThreadId: threadId,
        chatId: run.id,
        botResponse: botText,
      };
    } catch (err) {
      console.error('OpenAI Assistants API Error:', err);
      await this.prisma.chatbot_messages.create({
        data: {
          session_id: session.id,
          sender: 'bot',
          content:
            'Xin loi, hien tai toi khong the ket noi AI. Vui long thu lai sau.',
        },
      });
      throw new HttpException(
        'Loi ket noi AI',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async ensureAssistant() {
    if (this.configuredAssistantId) {
      await this.syncConfiguredAssistant(this.configuredAssistantId);
      return this.configuredAssistantId;
    }
    if (this.cachedAssistantId) return this.cachedAssistantId;

    const assistant = await this.client.beta.assistants.create({
      name: 'MakeCare Shopping Consultant',
      model: this.model,
      instructions: this.buildAssistantInstructions(),
      tools: [this.productSearchTool()],
    });

    this.cachedAssistantId = assistant.id;
    return assistant.id;
  }

  private async syncConfiguredAssistant(assistantId: string) {
    if (this.configuredAssistantSynced) return;
    this.configuredAssistantSynced = true;

    try {
      await this.client.beta.assistants.update(assistantId, {
        model: this.model,
        instructions: this.buildAssistantInstructions(),
        tools: [this.productSearchTool()],
      });
    } catch (error) {
      this.configuredAssistantSynced = false;
      console.warn('Could not sync configured OpenAI assistant:', error);
    }
  }

  private buildAssistantInstructions() {
    return [
      'Ban la MakeCare, tro ly tu van mua hang cho san thuong mai dien tu my pham.',
      'Tra loi bang tieng Viet tu nhien, ngan gon, hoi them neu thieu thong tin ve loai da, nhu cau, ngan sach hoac tone mau.',
      'Khi nguoi dung hoi ve san pham, goi y mua hang, so sanh, routine co san pham, hoac "nen mua gi", bat buoc goi tool search_products.',
      'Chi de xuat san pham co trong ket qua tool. Khong duoc tu bia ten, gia, ton kho, link hay khuyen mai.',
      'Moi san pham duoc de xuat nen co ten, gia tham khao neu co, ly do phu hop, va URL day du.',
      'Neu khong tim thay san pham phu hop, noi ro la chua tim thay trong shop va goi y tu khoa khac.',
      'Khong dua tu van y khoa chan doan. Neu nguoi dung co kich ung, mun nang, viem da, hay khuyen gap bac si da lieu.',
    ].join('\n');
  }

  private productSearchTool(): OpenAI.Beta.Assistants.AssistantTool {
    return {
      type: 'function',
      function: {
        name: 'search_products',
        description:
          'Search approved, published, in-stock products from the ecommerce database and return storefront URLs.',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description:
                'Search phrase, skin concern, makeup need, product type, brand, or category.',
            },
            shopId: {
              type: 'number',
              description:
                'Optional shop id to restrict recommendations to one shop.',
            },
            minPrice: {
              type: 'number',
              description: 'Optional minimum price in VND.',
            },
            maxPrice: {
              type: 'number',
              description: 'Optional maximum price in VND.',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of products to return, from 1 to 8.',
            },
          },
          required: ['query'],
        },
      },
    };
  }

  private async getOrCreateSession(
    dto: ChatDto,
    userId: number,
  ): Promise<ChatbotSessionRecord> {
    if (dto.sessionId) {
      const session = await this.prisma.chatbot_sessions.findUnique({
        where: { id: dto.sessionId },
        select: {
          id: true,
          user_id: true,
          coze_conversation_id: true,
          title: true,
        },
      });
      if (!session)
        throw new HttpException(
          ResponseMessages.CHAT.SESSION_NOT_FOUND,
          HttpStatus.NOT_FOUND,
        );
      if (session.user_id !== userId)
        throw new HttpException(
          ResponseMessages.CHAT.UNAUTHORIZED_SESSION,
          HttpStatus.FORBIDDEN,
        );
      return session;
    }

    const autoTitle =
      dto.message.length > 50
        ? dto.message.substring(0, 47) + '...'
        : dto.message;
    return this.prisma.chatbot_sessions.create({
      data: {
        user_id: userId,
        title: autoTitle,
      },
      select: {
        id: true,
        user_id: true,
        coze_conversation_id: true,
        title: true,
      },
    });
  }

  private async getOrCreateThread(session: ChatbotSessionRecord) {
    if (session.coze_conversation_id?.startsWith('thread_')) {
      return session.coze_conversation_id;
    }

    const thread = await this.client.beta.threads.create();
    await this.prisma.chatbot_sessions.update({
      where: { id: session.id },
      data: { coze_conversation_id: thread.id },
    });
    return thread.id;
  }

  private async waitForRun(
    threadId: string,
    runId: string,
    contextShopId?: number,
    productSearchResults?: ProductSearchResult[],
  ) {
    const terminalStatuses = [
      'completed',
      'failed',
      'cancelled',
      'expired',
      'incomplete',
    ];

    for (let attempt = 0; attempt < 60; attempt++) {
      let run = await this.client.beta.threads.runs.retrieve(runId, {
        thread_id: threadId,
      });

      if (run.status === 'requires_action') {
        const toolCalls =
          run.required_action?.submit_tool_outputs?.tool_calls || [];
        const tool_outputs = await Promise.all(
          toolCalls.map(async (toolCall) => ({
            tool_call_id: toolCall.id,
            output: await this.handleToolCall(
              toolCall,
              contextShopId,
              productSearchResults,
            ),
          })),
        );

        run = await this.client.beta.threads.runs.submitToolOutputs(runId, {
          thread_id: threadId,
          tool_outputs,
        });
      }

      if (terminalStatuses.includes(run.status)) return run;
      await this.sleep(1000);
    }

    throw new Error('OpenAI assistant timeout');
  }

  private async handleToolCall(
    toolCall: any,
    contextShopId?: number,
    productSearchResults?: ProductSearchResult[],
  ) {
    if (toolCall.function?.name !== 'search_products') {
      return JSON.stringify({
        error: `Unsupported tool: ${toolCall.function?.name}`,
      });
    }

    let args: ProductSearchArgs = {};
    try {
      args = JSON.parse(toolCall.function.arguments || '{}');
    } catch {
      args = {};
    }

    if (contextShopId && !args.shopId) args.shopId = contextShopId;
    const result = await this.searchProducts(args);
    if (result.products.length > 0) {
      productSearchResults?.push(result);
    }
    return JSON.stringify(result);
  }

  private async ensureProductLinks(
    assistantText: string,
    userMessage: string,
    shopId: number | undefined,
    productSearchResults: ProductSearchResult[],
  ) {
    if (this.hasProductLink(assistantText)) {
      return assistantText;
    }

    let products = this.uniqueProducts(
      productSearchResults.flatMap((result) => result.products),
    );

    if (
      products.length === 0 &&
      this.isProductRecommendationIntent(userMessage)
    ) {
      const fallbackResult = await this.searchProducts({
        query: userMessage,
        shopId,
        limit: 4,
      });
      products = this.uniqueProducts(fallbackResult.products);
    }

    if (products.length === 0) {
      return assistantText;
    }

    const productLines = products.slice(0, 4).map((product, index) => {
      const brandName = product.brand?.name ? ` - ${product.brand.name}` : '';
      const price = product.price_from
        ? ` (${this.formatVnd(product.price_from)})`
        : '';
      return `${index + 1}. ${product.name}${brandName}${price}: ${product.url}`;
    });

    return [
      assistantText.trim(),
      '',
      'San pham phu hop tren san:',
      ...productLines,
    ]
      .filter(Boolean)
      .join('\n');
  }

  private hasProductLink(text: string) {
    return /(?:https?:\/\/[^\s)]+)?\/product\/[A-Za-z0-9._~:/?#[\]@!$&'()*+,;=%-]+/.test(
      text,
    );
  }

  private uniqueProducts(products: ProductSearchResult['products']) {
    const seen = new Set<number>();
    return products.filter((product) => {
      if (seen.has(product.id)) return false;
      seen.add(product.id);
      return true;
    });
  }

  private isProductRecommendationIntent(message: string) {
    const normalized = this.normalizeForSearch(message);
    const intentTerms = [
      'san pham',
      'mua',
      'goi y',
      'tu van',
      'nen dung',
      'nen mua',
      'phu hop',
      'link',
      'kem',
      'son',
      'serum',
      'toner',
      'sua rua mat',
      'chong nang',
      'duong am',
      'skincare',
      'makeup',
      'da dau',
      'da kho',
      'da mun',
      'mun',
      'nam',
      'tan nhang',
      'tham',
    ];
    return intentTerms.some((term) => normalized.includes(term));
  }

  private formatVnd(value: number) {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(value);
  }

  private async searchProducts(
    args: ProductSearchArgs,
  ): Promise<ProductSearchResult> {
    const query = (args.query || '').trim();
    const limit = Math.min(Math.max(Number(args.limit) || 5, 1), 8);
    const minPrice = Number(args.minPrice);
    const maxPrice = Number(args.maxPrice);
    const hasMinPrice = Number.isFinite(minPrice);
    const hasMaxPrice = Number.isFinite(maxPrice);
    const keywords = this.extractSearchKeywords(query);
    const baseWhere: any = {
      is_deleted: false,
      is_published: true,
      moderation_status: 'approved',
      shop: {
        is_deleted: false,
        is_verified: true,
      },
      product_variants: {
        some: {
          is_active: true,
          is_deleted: false,
          stock: { gt: 0 },
          ...(hasMinPrice || hasMaxPrice
            ? {
                price: {
                  ...(hasMinPrice ? { gte: minPrice } : {}),
                  ...(hasMaxPrice ? { lte: maxPrice } : {}),
                },
              }
            : {}),
        },
      },
    };

    if (args.shopId) baseWhere.shop_id = Number(args.shopId);

    const searchWhere = {
      ...baseWhere,
      ...(query
        ? { OR: this.buildProductSearchConditions(query, keywords) }
        : {}),
    };
    let products = await this.fetchProductsForChatbot(searchWhere, limit * 4);

    if (products.length === 0 && query) {
      products = await this.fetchProductsForChatbot(baseWhere, 100);
    }

    const rankedProducts = products
      .map((product) => ({
        product,
        score: this.scoreProductMatch(product, query, keywords),
      }))
      .filter((item) => !query || item.score > 0 || products.length <= limit)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        const ratingDiff =
          Number(b.product.avg_rating || 0) - Number(a.product.avg_rating || 0);
        if (ratingDiff !== 0) return ratingDiff;
        return (b.product.review_count || 0) - (a.product.review_count || 0);
      })
      .slice(0, limit)
      .map((item) => item.product);

    const productsToReturn =
      rankedProducts.length > 0 ? rankedProducts : products.slice(0, limit);

    return {
      query,
      count: productsToReturn.length,
      products: productsToReturn.map((product) => {
        const firstVariant = product.product_variants[0];
        const mediaUrl = product.product_media[0]?.url;
        return {
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description
            ? product.description.slice(0, 320)
            : null,
          how_to_use: product.how_to_use
            ? product.how_to_use.slice(0, 220)
            : null,
          url: `${this.frontendUrl}/product/${product.slug || product.id}`,
          image_url: mediaUrl ? this.absoluteMediaUrl(mediaUrl) : null,
          shop: product.shop,
          brand: product.brand,
          categories: product.product_categories.map(
            (item) => item.category.name,
          ),
          price_from: firstVariant ? Number(firstVariant.price) : null,
          avg_rating: Number(product.avg_rating || 0),
          review_count: product.review_count,
          variants: product.product_variants.map((variant) => ({
            id: variant.id,
            name: variant.name,
            sku: variant.sku,
            price: Number(variant.price),
            compare_at_price: variant.compare_at_price
              ? Number(variant.compare_at_price)
              : null,
            stock: variant.stock,
            shade_hex: variant.shade_hex,
            size_label: variant.size_label,
          })),
        };
      }),
    };
  }

  private buildProductSearchConditions(query: string, keywords: string[]) {
    const terms = [query, ...keywords].filter(Boolean);
    return terms.flatMap((term) => [
      { name: { contains: term, mode: 'insensitive' as const } },
      { description: { contains: term, mode: 'insensitive' as const } },
      { how_to_use: { contains: term, mode: 'insensitive' as const } },
      { brand: { name: { contains: term, mode: 'insensitive' as const } } },
      {
        product_categories: {
          some: {
            category: {
              name: { contains: term, mode: 'insensitive' as const },
            },
          },
        },
      },
    ]);
  }

  private fetchProductsForChatbot(where: any, take: number) {
    return this.prisma.products.findMany({
      where,
      take,
      orderBy: [
        { avg_rating: 'desc' },
        { review_count: 'desc' },
        { created_at: 'desc' },
      ],
      include: {
        shop: { select: { id: true, name: true, slug: true } },
        brand: { select: { id: true, name: true, slug: true } },
        product_categories: {
          include: {
            category: { select: { id: true, name: true, slug: true } },
          },
        },
        product_media: {
          orderBy: { sort_order: 'asc' },
          take: 1,
          select: { url: true },
        },
        product_variants: {
          where: {
            is_active: true,
            is_deleted: false,
            stock: { gt: 0 },
          },
          orderBy: { price: 'asc' },
          take: 3,
          select: {
            id: true,
            name: true,
            sku: true,
            price: true,
            compare_at_price: true,
            stock: true,
            shade_hex: true,
            size_label: true,
          },
        },
      },
    });
  }

  private extractSearchKeywords(query: string) {
    const stopWords = new Set([
      'toi',
      'minh',
      'ban',
      'can',
      'muon',
      'tim',
      'mua',
      'san',
      'pham',
      'cho',
      'voi',
      've',
      'la',
      'co',
      'khong',
      'nen',
      'gi',
      'nao',
      'tu',
      'van',
      'mình',
      'bạn',
      'cần',
      'muốn',
      'tìm',
      'mua',
      'sản',
      'phẩm',
      'cho',
      'với',
      'về',
      'là',
      'có',
      'không',
      'nên',
      'gì',
      'nào',
      'tư',
      'vấn',
    ]);

    return Array.from(
      new Set(
        query
          .split(/[^\p{L}\p{N}]+/u)
          .map((term) => term.trim())
          .filter((term) => term.length >= 2)
          .filter((term) => !stopWords.has(term.toLowerCase()))
          .slice(0, 8),
      ),
    );
  }

  private scoreProductMatch(product: any, query: string, keywords: string[]) {
    const normalizedQuery = this.normalizeForSearch(query);
    const fields = {
      name: this.normalizeForSearch(product.name || ''),
      description: this.normalizeForSearch(product.description || ''),
      howToUse: this.normalizeForSearch(product.how_to_use || ''),
      brand: this.normalizeForSearch(product.brand?.name || ''),
      categories: this.normalizeForSearch(
        product.product_categories
          ?.map((item) => item.category.name)
          .join(' ') || '',
      ),
    };

    let score = 0;
    if (normalizedQuery) {
      if (fields.name.includes(normalizedQuery)) score += 12;
      if (fields.description.includes(normalizedQuery)) score += 10;
      if (fields.howToUse.includes(normalizedQuery)) score += 7;
      if (fields.brand.includes(normalizedQuery)) score += 6;
      if (fields.categories.includes(normalizedQuery)) score += 6;
    }

    keywords.forEach((keyword) => {
      const normalizedKeyword = this.normalizeForSearch(keyword);
      if (!normalizedKeyword) return;
      if (fields.name.includes(normalizedKeyword)) score += 5;
      if (fields.description.includes(normalizedKeyword)) score += 4;
      if (fields.howToUse.includes(normalizedKeyword)) score += 3;
      if (fields.brand.includes(normalizedKeyword)) score += 3;
      if (fields.categories.includes(normalizedKeyword)) score += 3;
    });

    return score;
  }

  private normalizeForSearch(value: string) {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  private absoluteMediaUrl(url: string) {
    if (/^https?:\/\//i.test(url)) return url;
    return `${this.backendUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  }

  private async getLatestAssistantText(threadId: string) {
    const messages = await this.client.beta.threads.messages.list(threadId, {
      order: 'desc',
      limit: 10,
    });

    const assistantMessage = messages.data.find(
      (message) => message.role === 'assistant',
    );
    const textBlocks = assistantMessage?.content
      ?.map((content) => {
        if (content.type === 'text') return content.text.value;
        return '';
      })
      .filter(Boolean);

    return (
      textBlocks?.join('\n').trim() ||
      'Xin loi, toi chua co cau tra loi phu hop.'
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async listSessions(userId: number) {
    return this.prisma.chatbot_sessions.findMany({
      where: { user_id: userId },
      orderBy: { updated_at: 'desc' },
      select: {
        id: true,
        user_id: true,
        coze_conversation_id: true,
        title: true,
        created_at: true,
        updated_at: true,
      },
    });
  }

  async getMessages(sessionId: number, userId: number) {
    const session = await this.prisma.chatbot_sessions.findUnique({
      where: { id: sessionId },
      select: { id: true, user_id: true },
    });
    if (!session)
      throw new HttpException(
        ResponseMessages.CHAT.SESSION_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    if (session.user_id !== userId)
      throw new HttpException(
        ResponseMessages.CHAT.UNAUTHORIZED_SESSION,
        HttpStatus.FORBIDDEN,
      );
    return this.prisma.chatbot_messages.findMany({
      where: { session_id: sessionId },
      orderBy: { created_at: 'asc' },
    });
  }
}

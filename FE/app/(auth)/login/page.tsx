import { LoginPage } from '@/components/pages/LoginPage';
import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Đăng nhập",
    description: "Đăng nhập vào BeautyAI để trải nghiệm mua sắm và làm đẹp thông minh.",
  };
}

export default function Page() {
  return <LoginPage />;
}

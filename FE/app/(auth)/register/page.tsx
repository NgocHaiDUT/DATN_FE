import { RegisterPage } from '@/components/pages/RegisterPage';
import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Đăng ký",
    description: "Tạo tài khoản BeautyAI để bắt đầu hành trình làm đẹp của bạn.",
  };
}

export default function Page() {
  return <RegisterPage />;
}

import ThemeRegistry from '@/components/ThemeRegistry';
import I18nProvider from '@/components/I18nProvider';
import './globals.css';

export const metadata = {
  title: 'MD Chunker - Markdown 智能分块工具',
  description: '高级 Markdown 分块工具，支持原子块保护、5维度质量评分、可视化编辑',
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>
        <ThemeRegistry>
          <I18nProvider>
            {children}
          </I18nProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}

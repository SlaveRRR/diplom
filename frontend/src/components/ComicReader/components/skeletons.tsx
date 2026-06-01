import { Flex } from 'antd';

type ReaderPageSkeletonProps = {
  className?: string;
};

export const ReaderPageSkeleton = ({ className = '' }: ReaderPageSkeletonProps) => (
  <div
    className={`relative flex min-h-[40vh] items-center justify-center overflow-hidden bg-[#151018] sm:min-h-[60vh] ${className}`}
  >
    <div className="absolute inset-0 animate-pulse bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0))]" />
    <div className="relative w-full max-w-[560px] px-6">
      <div className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04] shadow-[0_24px_60px_rgba(0,0,0,0.28)]">
        <div className="aspect-[3/4] w-full animate-pulse bg-[linear-gradient(135deg,rgba(255,255,255,0.14),rgba(255,255,255,0.04))]" />
      </div>
    </div>
  </div>
);

export const ReaderHeaderSkeleton = () => (
  <div className="sticky top-0 z-20 w-full border-b border-white/10 bg-[#24193e]/95 px-3 py-3 backdrop-blur sm:px-6">
    <Flex vertical gap={12} className="w-full">
      <Flex align="center" justify="space-between" gap={12}>
        <div className="h-11 w-11 animate-pulse rounded-2xl bg-white/10" />
        <Flex gap={8}>
          <div className="h-10 w-10 animate-pulse rounded-2xl bg-white/10" />
          <div className="h-10 w-10 animate-pulse rounded-2xl bg-white/10" />
        </Flex>
      </Flex>
      <div className="space-y-3">
        <div className="h-8 w-full max-w-[360px] animate-pulse rounded-2xl bg-white/10" />
        <div className="h-5 w-full max-w-[240px] animate-pulse rounded-2xl bg-white/10" />
      </div>
    </Flex>
  </div>
);

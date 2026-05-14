import { cn } from "../../utils/cn";

type SkeletonProps = {
  className?: string;
};

const Skeleton = ({ className }: SkeletonProps) => (
  <div className={cn("animate-pulse rounded-md bg-muted", className)} />
);

export { Skeleton };

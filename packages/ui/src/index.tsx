import type { PropsWithChildren } from 'react';

export const Panel = ({ children }: PropsWithChildren) => {
  return (
    <section
      style={{
        background: 'rgba(7, 16, 20, 0.8)',
        border: '1px solid rgba(89, 217, 255, 0.3)',
        borderRadius: 12,
        padding: 12,
      }}
    >
      {children}
    </section>
  );
};

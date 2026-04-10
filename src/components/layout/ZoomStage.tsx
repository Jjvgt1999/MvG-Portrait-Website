import React from 'react';

type ZoomStageProps = {
  children: React.ReactNode;
};

export const ZoomStage = React.forwardRef<HTMLDivElement, ZoomStageProps>(
  function ZoomStage({ children }, ref) {
    return (
      <div ref={ref} className="zoom-stage">
        {children}
      </div>
    );
  }
);

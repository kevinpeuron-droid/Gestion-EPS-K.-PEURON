import React, { useState } from 'react';
import { useEPSKernel } from '../hooks/useEPSKernel';
import { CAModule } from '../components/CAModule';

interface Props {
  kernel: ReturnType<typeof useEPSKernel>;
}

export const Dashboard: React.FC<Props> = ({ kernel }) => {
  return (
    <div className="h-full rounded-[2.5rem] bg-white border border-white/60 shadow-xl shadow-slate-200/50 overflow-hidden relative">
        <CAModule 
            kernel={kernel} // Passage du Kernel complet
            activity={kernel.currentActivity}
            ca={kernel.currentCA}
            activeTab={kernel.activeTab}
            onTabChange={kernel.setTab}
            currentEngineId={kernel.currentEngineId}
            currentApp={kernel.currentApp}
            onSaveResult={kernel.saveResult}
            results={kernel.getSynthesis()}
            sessionKey={kernel.sessionKey}
        />
    </div>
  );
};

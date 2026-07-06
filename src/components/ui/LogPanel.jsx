import React, { useRef, useEffect } from 'react';
import Card, { CardHeader, CardBody } from '@/components/ui/Card';
import { Terminal } from 'lucide-react';

export default function LogPanel({ logs, title = "Operation Log" }) {
  const logRef = useRef(null);

  // Auto-scroll to bottom when logs update
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <Card>
      <CardHeader title={title} icon={Terminal} />
      <div 
        ref={logRef}
        className="bg-base font-mono text-[11px] p-[10px] max-h-[110px] overflow-y-auto custom-scrollbar flex flex-col gap-[2px]"
      >
        {logs && logs.length > 0 ? logs.map((log, i) => {
          let colorClass = 'text-text-muted';
          
          if (log.type === 'success' || log.msg?.toLowerCase().includes('success') || log.msg?.toLowerCase().includes('allocated')) {
             colorClass = 'text-green';
          } else if (log.type === 'error' || log.type === 'danger' || log.msg?.toLowerCase().includes('error') || log.msg?.toLowerCase().includes('fail') || log.msg?.toLowerCase().includes('deleted')) {
             colorClass = 'text-red';
          } else if (log.type === 'warning' || log.msg?.toLowerCase().includes('wait') || log.msg?.toLowerCase().includes('block')) {
             colorClass = 'text-orange';
          }

          return (
            <div key={i} className={`whitespace-nowrap ${colorClass}`}>
              <span className="text-overlay mr-2">{`[${i.toString().padStart(3, '0')}]`}</span>
              {log.msg || log}
            </div>
          );
        }) : (
          <div className="text-text-muted italic">Waiting for operations...</div>
        )}
      </div>
    </Card>
  );
}

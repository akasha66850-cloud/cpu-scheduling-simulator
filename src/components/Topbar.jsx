import React from 'react'
import { Download, FileText, Keyboard, FileDown } from 'lucide-react'
import Button from '@/components/ui/Button'

export default function Topbar({ title, icon: Icon, moduleNumber }) {
  return (
    <header className="h-[56px] bg-surface border-b border-border flex items-center justify-between px-[20px] z-30 sticky top-0">
       
       <div className="flex items-center gap-[12px]">
         {Icon && <Icon className="w-[18px] h-[18px] text-accent" />}
         <h1 className="text-[15px] font-semibold text-text-primary m-0 p-0 leading-none">
           {title || 'Dashboard'}
         </h1>
         {moduleNumber && (
           <span className="bg-elevated border border-border text-text-secondary text-[10px] font-bold px-[8px] py-[2px] rounded-[10px] ml-2 leading-none">
             M{moduleNumber}
           </span>
         )}
       </div>

       <div className="flex items-center gap-[12px]">
         
         <Button variant="ghost" icon={FileDown}>
            CSV
         </Button>
         
         <Button variant="ghost" icon={FileText}>
            PDF
         </Button>

         <div className="h-[20px] w-px bg-border mx-[4px]"></div>

         <Button variant="ghost" icon={Keyboard} className="!px-[8px]" title="Keyboard Shortcuts" />

       </div>
    </header>
  )
}

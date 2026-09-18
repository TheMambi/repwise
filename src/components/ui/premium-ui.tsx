import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export const PremiumButton = ({
    children,
    onClick,
    className,
    variant = 'primary',
    icon: Icon
}: {
    children: React.ReactNode,
    onClick?: () => void,
    className?: string,
    variant?: 'primary' | 'secondary' | 'outline',
    icon?: React.ElementType
}) => {
    const variants = {
        primary: "bg-white text-black hover:bg-slate-200 shadow-[0_0_20px_rgba(255,255,255,0.3)]",
        secondary: "bg-slate-900 text-white border border-white/10 hover:bg-slate-800",
        outline: "bg-transparent text-white border border-white/20 hover:border-white/40"
    }

    return (
        <button
            onClick={onClick}
            className={cn(
                "px-8 py-3 rounded-full font-bold transition-all transform active:scale-95 flex items-center justify-center gap-2",
                variants[variant],
                className
            )}
        >
            {children}
            {Icon && <Icon className="w-4 h-4" />}
        </button>
    )
}

export const GlassCard = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={cn(
        "bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 shadow-2xl",
        className
    )}>
        {children}
    </div>
)

export const SelectionPill = ({
    label,
    selected,
    onClick
}: {
    label: string,
    selected: boolean,
    onClick: () => void
}) => (
    <button
        onClick={onClick}
        className={cn(
            "px-6 py-2 rounded-full border transition-all flex items-center gap-2 text-sm font-medium",
            selected
                ? "bg-white text-black border-white"
                : "bg-transparent border-white/20 text-white/60 hover:border-white/40 hover:text-white"
        )}
    >
        {selected && <Check className="w-3 h-3" />}
        {label}
    </button>
)

import { CheckCircle, Clock, Loader2, CreditCard, CircleDot } from "lucide-react";
import { cn } from "@/lib/utils";






const steps = [
{ key: "pending", label: "Pending", icon: Clock },
{ key: "in_progress", label: "In Progress", icon: Loader2 },
{ key: "completed", label: "Completed", icon: CheckCircle },
{ key: "paid", label: "Paid", icon: CreditCard }];


const statusOrder = {
  pending: 0,
  in_progress: 1,
  completed: 2,
  paid: 3
};

export function ServiceStatusStepper({ status, className }) {
  const currentIndex = statusOrder[status] ?? 0;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const Icon = step.icon;

        return (
          <div key={step.key} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors",
                  isCompleted && "border-green-500 bg-green-500 text-white",
                  isCurrent && "border-accent bg-accent/10 text-accent",
                  !isCompleted && !isCurrent && "border-muted bg-muted text-muted-foreground"
                )}>
                
                {isCompleted ?
                <CheckCircle className="h-4 w-4" /> :
                isCurrent ?
                <CircleDot className="h-4 w-4" /> :

                <Icon className="h-4 w-4" />
                }
              </div>
              <span
                className={cn(
                  "mt-1 text-[10px] font-medium",
                  isCurrent ? "text-foreground" : "text-muted-foreground"
                )}>
                
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 &&
            <div
              className={cn(
                "mx-1 h-0.5 w-6 rounded-full mb-5",
                index < currentIndex ? "bg-green-500" : "bg-muted"
              )} />

            }
          </div>);

      })}
    </div>);

}
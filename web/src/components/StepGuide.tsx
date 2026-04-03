'use client';

interface Step {
    number: number;
    title: string;
    content: React.ReactNode;
    borderColor: string;
    bgColor: string;
}

interface StepGuideProps {
    steps: Step[];
    introduction?: React.ReactNode;
    tip?: React.ReactNode;
}

export default function StepGuide({ steps, introduction, tip }: StepGuideProps) {
    return (
        <div className="max-w-4xl mx-auto">
            {/* Introduction */}
            {introduction && (
                <div className="bg-background p-8 rounded-xl mb-8">
                    {introduction}
                </div>
            )}

            {/* Steps */}
            <div className="space-y-6">
                {steps.map((step) => (
                    <div key={step.number} className={`bg-background p-6 rounded-xl border-l-4 ${step.borderColor}`}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`w-8 h-8 ${step.bgColor} text-white rounded-full flex items-center justify-center font-bold`}>
                                {step.number}
                            </div>
                            <h4 className="text-xl font-bold text-foreground">{step.title}</h4>
                        </div>
                        <div className="ml-11">
                            {step.content}
                        </div>
                    </div>
                ))}
            </div>

            {/* Tip */}
            {tip && (
                <div className="bg-accent/10 border border-accent p-6 rounded-xl mt-8">
                    {tip}
                </div>
            )}
        </div>
    );
}
const REACTION_TYPES = [
    { emoji: "🔥", label: "Brilliant", value: "brilliant" },
    { emoji: "💡", label: "Insightful", value: "insightful" },
    { emoji: "🤝", label: "Helpful", value: "helpful" },
    { emoji: "👏", label: "Congrats", value: "congrats" }
];

export function Reactions({ reactions, currentUser, onToggleReaction }: { reactions: any[], currentUser?: any, onToggleReaction?: (type: string) => void }) {
    if (!reactions || reactions.length === 0) return null;

    const grouped = reactions.reduce((acc: any, r: any) => {
        if (!acc[r.reaction_type]) {
            acc[r.reaction_type] = { count: 0, hasReacted: false };
        }
        acc[r.reaction_type].count += 1;
        if (currentUser && r.user_id === currentUser.id) {
            acc[r.reaction_type].hasReacted = true;
        }
        return acc;
    }, {});

    return (
        <div className="flex gap-2">
            {Object.entries(grouped).map(([type, data]: [string, any]) => {
                const emoji = REACTION_TYPES.find(t => t.value === type)?.emoji;
                return emoji ? (
                    <button 
                        key={type} 
                        onClick={() => onToggleReaction && data.hasReacted && onToggleReaction(type)}
                        className={`px-2 py-0.5 rounded text-xs transition-colors ${
                            data.hasReacted ? "bg-[#333] hover:bg-[#444] cursor-pointer" : "bg-[#222] cursor-default"
                        }`}
                        title={data.hasReacted ? "Click to remove reaction" : ""}
                    >
                        {emoji} {data.count}
                    </button>
                ) : null;
            })}
        </div>
    );
}

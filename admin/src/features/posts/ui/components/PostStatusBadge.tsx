import { ModerationStatus } from '../../domain/entities/Post';

interface PostStatusBadgeProps {
    status: ModerationStatus;
    className?: string;
}

/**
 * PostStatusBadge - Visual badge component for displaying post moderation status
 */
export function PostStatusBadge({ status, className = '' }: PostStatusBadgeProps) {
    const getStatusConfig = (status: ModerationStatus) => {
        switch (status) {

            case ModerationStatus.APPROVED:
                return {
                    label: 'Approved',
                    bgColor: 'bg-green-100',
                    textColor: 'text-green-800',
                    borderColor: 'border-green-300',
                    icon: '✓',
                };
            case ModerationStatus.REJECTED:
                return {
                    label: 'Rejected',
                    bgColor: 'bg-red-100',
                    textColor: 'text-red-800',
                    borderColor: 'border-red-300',
                    icon: '✕',
                };
            case ModerationStatus.REMOVED:
                return {
                    label: 'Removed',
                    bgColor: 'bg-gray-100',
                    textColor: 'text-gray-800',
                    borderColor: 'border-gray-300',
                    icon: '🗑',
                };
            default:
                return {
                    label: status,
                    bgColor: 'bg-gray-100',
                    textColor: 'text-gray-800',
                    borderColor: 'border-gray-300',
                    icon: '?',
                };
        }
    };

    const config = getStatusConfig(status);

    if (!config) {
        return null;
    }

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${config.bgColor} ${config.textColor} ${config.borderColor} ${className}`}
            title={config.label}
        >
            <span className="text-sm">{config.icon}</span>
            {config.label}
        </span>
    );
}

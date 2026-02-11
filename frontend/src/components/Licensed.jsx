

import { 
    CheckCircle,
    Warning as AlertCircle,
    Shield as ShieldIcon,
    Warning as WarningIcon,
    ChevronRight as ChevronRightIcon
} from '@mui/icons-material';
import { useContext, useState } from "react";
import { Context } from "../context/ContextApi.jsx";
import { useNavigate } from 'react-router-dom';

const Licensed = ({licensed, expanded, showBadge}) => {
    
    const { themeMode } = useContext(Context);
    const navigate = useNavigate()


    const [isHovered, setIsHovered] = useState(false);
    
      const theme = {
        light: {
          cardBg: '#ffffff',
          cardBgHover: '#f5f7fa',
          border: '#e1e4e8',
          textPrimary: '#1f2937',
          textSecondary: '#6b7280',
          textMuted: '#9ca3af',
          success: '#10b981',
          successBg: licensed ? 'rgba(5, 150, 105, 0.08)' : '#ddf4ff',
          successBorder: 'rgba(5, 150, 105, 0.2)',
          warning: '#d97706',
          warningBg: licensed ? '#fef3c7' : 'rgba(245, 158, 11, 0.08)',
          warningBorder: 'rgba(245, 158, 11, 0.2)',
          shadow: 'rgba(0, 0, 0, 0.05)',
        },
        dark: {
          cardBg: '#1a1a1a',
          cardBgHover: '#242424',
          border: '#30363d',
          textPrimary: '#e6edf3',
          textSecondary: '#8b949e',
          textMuted: '#6e7681',
          success: '#10b981',
          successBg: 'rgba(16, 185, 129, 0.1)',
          successBorder: 'rgba(16, 185, 129, 0.3)',
          warning: '#f59e0b',
          warningBg: 'rgba(245, 158, 11, 0.1)',
          warningBorder: 'rgba(245, 158, 11, 0.3)',
          shadow: 'rgba(0, 0, 0, 0.3)',
        },
      };
    
      const colors = themeMode === "dark" ? theme.dark : theme.light;
    
      const statusConfig = licensed
        ? {
            icon: showBadge ? ShieldIcon : CheckCircle,
            text: showBadge ? 'Licensed' : 'Enterprise Licensed',
            shortText: 'Licensed',
            subtitle: 'Full access',
            color: colors.success,
            bgColor: colors.successBg,
            borderColor: colors.successBorder,
            description: 'All features unlocked',
          }
        : {
            icon: showBadge ? WarningIcon : AlertCircle,
            text: showBadge ? 'Unlicensed' : 'Activate License',
            shortText: 'Inactive',
            subtitle: 'Limited access',
            color: colors.warning,
            bgColor: colors.warningBg,
            borderColor: colors.warningBorder,
            description: 'Limited access',
          };
    
      const Icon = statusConfig.icon;
    
    // Display badge when showing license status only
    // Display full component for CTA to license activation
    if (showBadge) {
        return (
            <div
                onClick={()=> {navigate('/admin?admin_tab=billingstats');}}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 14px',
                    borderRadius: 12,
                    cursor: 'pointer',
                    backgroundColor: statusConfig.bgColor,
                    border: `1.5px solid ${statusConfig.borderColor}`,
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                    boxShadow: isHovered
                        ? `0 4px 12px ${colors.shadow}, 0 0 0 3px ${statusConfig.bgColor}`
                        : `0 2px 4px ${colors.shadow}`,
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Shine effect on hover */}
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        width: '100%',
                        height: '100%',
                        background: `linear-gradient(90deg, transparent, rgba(255,255,255,${themeMode === "dark" ? '0.1' : '0.2'}), transparent)`,
                        transition: 'left 0.5s',
                        left: isHovered ? '100%' : '-100%',
                        pointerEvents: 'none',
                    }}
                />

                {/* Status indicator with pulse */}
                <div
                    style={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <span
                        style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: statusConfig.color,
                            boxShadow: `0 0 8px ${statusConfig.color}`,
                            position: 'relative',
                            zIndex: 1,
                        }}
                    />
                    {/* Pulse ring */}
                    <span
                        style={{
                            position: 'absolute',
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: statusConfig.color,
                            opacity: 0.75,
                        }}
                    />
                </div>

                <Icon
                    style={{
                        color: statusConfig.color,
                        flexShrink: 0,
                        fontSize: 16,
                    }}
                />

                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1,
                        alignItems: 'flex-start',
                    }}
                >
                    <span
                        style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: statusConfig.color,
                            lineHeight: 1.2,
                            letterSpacing: '0.2px',
                        }}
                    >
                        {statusConfig.text}
                    </span>
                    <span
                        style={{
                            fontSize: 10,
                            fontWeight: 600,
                            color: statusConfig.color,
                            opacity: 0.7,
                            lineHeight: 1,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                        }}
                    >
                        {statusConfig.subtitle}
                    </span>
                </div>

                <ChevronRightIcon
                    style={{
                        color: statusConfig.color,
                        opacity: 0.6,
                        flexShrink: 0,
                        fontSize: 14,
                        transform: isHovered ? 'translateX(2px)' : 'translateX(0)',
                        transition: 'all 0.2s',
                    }}
                />
            </div>
        );
    }

    return (
        <div
            onClick={()=> {navigate('/admin?admin_tab=billingstats');}}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: expanded ? 12 : 8,
            padding: expanded ? '10px 14px' : '10px',
            marginBottom: 20,
            marginRight: 12,
            borderRadius: 10,
            cursor: 'pointer',
            backgroundColor: isHovered ? colors.cardBgHover : colors.cardBg,
            border: `1.5px solid ${licensed ? statusConfig.color : colors.border}`,
            boxShadow: `0 1px 3px ${colors.shadow}`,
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: isHovered ? 'translateY(-1px)' : 'translateY(0)',
            position: 'relative',
            overflow: 'hidden',
            }}
        >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: `linear-gradient(135deg, ${statusConfig.bgColor} 0%, transparent 100%)`,
                  opacity: 0.5,
                  pointerEvents: 'none',
                }}
              />
        
              {/* Content */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  position: 'relative',
                  flex: 1,
                  minWidth: 0,
                }}
              >
               {expanded && (
                 <div
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon
                    style={{
                      color: statusConfig.color,
                      flexShrink: 0,
                      fontSize: 18,
                    }}
                  />
                  {!licensed && (
                    <div
                      style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        border: `2px solid ${statusConfig.color}`,
                      }}
                    />
                  )}
                </div>
                )}
        
                {/* Text content */}
                {expanded && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                      minWidth: 0,
                      flex: 1,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: colors.textPrimary,
                        lineHeight: 1.2,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {statusConfig.text}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 500,
                        color: colors.textSecondary,
                        lineHeight: 1.2,
                      }}
                    >
                      {statusConfig.description}
                    </span>
                  </div>
                )}
        
                {!expanded && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: statusConfig.color,
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                    }}
                  >
                    {licensed ? 'ON' : 'OFF'}
                  </span>
                )}
              </div>
        
              {/* Arrow indicator (only when expanded) */}
              {expanded && (
                <ChevronRightIcon
                  style={{
                    color: colors.textMuted,
                    flexShrink: 0,
                    fontSize: 16,
                    opacity: isHovered ? 1 : 0.5,
                    transform: isHovered ? 'translateX(2px)' : 'translateX(0)',
                    transition: 'all 0.2s',
                  }}
                />
              )}
            </div>
    );
}

export default Licensed;
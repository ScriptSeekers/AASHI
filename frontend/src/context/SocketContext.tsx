import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext.js';
import { RoomInvitationDTO, SOCKET_EVENTS, CoupleRoomDTO } from '@aashi/shared';
import { invitationApi } from '../api/endpoints.js';
import { soundManager } from '../utils/sound.js';
import { useNavigate } from 'react-router-dom';

export interface PartnerDetails {
  id: string;
  name: string;
  username: string;
  avatar?: string | null;
  isOnline: boolean;
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  partnerInfo: PartnerDetails | null;
  partnerOnline: boolean;
  activeInvitation: RoomInvitationDTO | null; // Incoming invite for recipient
  outgoingInvitation: RoomInvitationDTO | null; // Outgoing invite sent by user
  invitePartner: (gameType?: string) => Promise<boolean>;
  cancelOutgoingInvitation: () => Promise<void>;
  acceptInvitation: (invitationId: string) => Promise<void>;
  declineInvitation: (invitationId: string) => Promise<void>;
  closeInvitationPopup: () => void;
  senderNotification: string | null;
  clearSenderNotification: () => void;
  refreshPartnerStatus: () => Promise<void>;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [partnerInfo, setPartnerInfo] = useState<PartnerDetails | null>(null);
  const [partnerOnline, setPartnerOnline] = useState<boolean>(false);
  const [activeInvitation, setActiveInvitation] = useState<RoomInvitationDTO | null>(null);
  const [outgoingInvitation, setOutgoingInvitation] = useState<RoomInvitationDTO | null>(null);
  const [senderNotification, setSenderNotification] = useState<string | null>(null);
  const navigate = useNavigate();
  const socketRef = useRef<Socket | null>(null);

  const fetchPartnerStatus = async () => {
    if (!user) return;
    try {
      const res = await invitationApi.getPartnerStatus();
      if (res.hasPartner && res.partner) {
        setPartnerInfo(res.partner);
        setPartnerOnline(res.partner.isOnline);
      }
      if (res.pendingInvitation) {
        if (res.pendingInvitation.recipientId === user.id) {
          setActiveInvitation(res.pendingInvitation);
        } else if (res.pendingInvitation.senderId === user.id) {
          setOutgoingInvitation(res.pendingInvitation);
        }
      }
    } catch {}
  };

  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      setPartnerInfo(null);
      setPartnerOnline(false);
      setActiveInvitation(null);
      setOutgoingInvitation(null);
      return;
    }

    fetchPartnerStatus();

    const token = localStorage.getItem('aashi_token') || localStorage.getItem('duvora_token');
    const backendOrigin = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
    const socketTarget = backendOrigin || '/';

    const newSocket = io(socketTarget, {
      auth: { token },
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      fetchPartnerStatus();
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Partner online/offline presence update
    newSocket.on(SOCKET_EVENTS.PARTNER_STATUS, (data: { partnerId: string; isOnline: boolean }) => {
      setPartnerOnline(data.isOnline);
      setPartnerInfo(prev => prev ? { ...prev, isOnline: data.isOnline } : null);
    });

    // 1. RECIPIENT: Immediate invitation popup received in real time
    newSocket.on(SOCKET_EVENTS.PARTNER_INVITATION_RECEIVED, (invitation: RoomInvitationDTO) => {
      setActiveInvitation(invitation);
      soundManager.playInviteChime();
    });

    // 2. SENDER: Immediate notification that partner accepted!
    newSocket.on(SOCKET_EVENTS.PARTNER_ACCEPTED, (data: { recipientName: string; roomId: string; gameType?: string }) => {
      setOutgoingInvitation(null);
      soundManager.playVictory();
      setSenderNotification(`💗 ${data.recipientName} accepted your invitation!`);
      navigate(`/room/${data.roomId}`);
    });

    // 3. SENDER: Notification that partner declined
    newSocket.on(SOCKET_EVENTS.PARTNER_DECLINED, (data: { recipientName: string }) => {
      setOutgoingInvitation(null);
      soundManager.playPop();
      setSenderNotification(`${data.recipientName} declined the game invitation.`);
    });

    // 4. RECIPIENT: Notification that inviter cancelled
    newSocket.on(SOCKET_EVENTS.PARTNER_INVITATION_CANCELLED, (data: { senderName: string }) => {
      setActiveInvitation(null);
      soundManager.playPop();
      setSenderNotification(`${data.senderName} cancelled the invitation.`);
    });

    // 5. Expired
    newSocket.on(SOCKET_EVENTS.PARTNER_INVITATION_EXPIRED, () => {
      setActiveInvitation(null);
      setOutgoingInvitation(null);
    });

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  // Direct 1-Click Partner Invitation
  const invitePartner = async (gameType?: string): Promise<boolean> => {
    try {
      soundManager.playPop();
      const res = await invitationApi.invitePartnerDirect(gameType);
      setOutgoingInvitation(res.invitation);
      soundManager.playCardFlip();
      return true;
    } catch (err: any) {
      soundManager.playPop();
      const msg = err.message || 'Failed to send invitation.';
      setSenderNotification(msg);
      return false;
    }
  };

  const cancelOutgoingInvitation = async () => {
    if (!outgoingInvitation) return;
    try {
      soundManager.playPop();
      await invitationApi.cancel(outgoingInvitation.id);
      setOutgoingInvitation(null);
    } catch {
      setOutgoingInvitation(null);
    }
  };

  const acceptInvitation = async (invitationId: string) => {
    try {
      const res = await invitationApi.accept(invitationId);
      setActiveInvitation(null);
      soundManager.playVictory();
      navigate(`/room/${res.room.id}`);
    } catch (err: any) {
      alert(err.message || 'Failed to accept invitation');
      setActiveInvitation(null);
    }
  };

  const declineInvitation = async (invitationId: string) => {
    try {
      await invitationApi.decline(invitationId);
      setActiveInvitation(null);
      soundManager.playPop();
    } catch {
      setActiveInvitation(null);
    }
  };

  const closeInvitationPopup = () => {
    setActiveInvitation(null);
  };

  const clearSenderNotification = () => {
    setSenderNotification(null);
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        partnerInfo,
        partnerOnline,
        activeInvitation,
        outgoingInvitation,
        invitePartner,
        cancelOutgoingInvitation,
        acceptInvitation,
        declineInvitation,
        closeInvitationPopup,
        senderNotification,
        clearSenderNotification,
        refreshPartnerStatus: fetchPartnerStatus
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  doc, 
  updateDoc, 
  getDoc,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { handleGeneralError } from '../lib/error-handler';
import { sendNotification } from '../lib/notifications';
import { useAuth } from '../AuthContext';
import { Message, Chat, User, Listing } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { Send, User as UserIcon, Search, ArrowLeft, MoreVertical, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

const Messages = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [chats, setChats] = useState<(Chat & { otherUser?: User })[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(searchParams.get('chatId'));
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedChatUser, setSelectedChatUser] = useState<User | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch all chats for the user
  useEffect(() => {
    if (!user || !user.uid) return;

    const chatsQuery = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(chatsQuery, async (snapshot) => {
      const chatData = await Promise.all(snapshot.docs.map(async (chatDoc) => {
        const data = chatDoc.data() as Chat;
        const otherUserId = data.participants.find(p => p !== user.uid);
        
        let otherUser: User | undefined;
        if (otherUserId) {
          const userDoc = await getDoc(doc(db, 'users_public', otherUserId));
          if (userDoc.exists()) {
            otherUser = userDoc.data() as User;
          }
        }
        
        return { id: chatDoc.id, ...data, otherUser };
      }));
      
      setChats(chatData);
      setLoading(false);

      // Handle listingId from query params to initiate a new chat
      const listingId = searchParams.get('listingId');
      if (listingId && !selectedChatId) {
        const initiateChat = async () => {
          try {
            const listingDoc = await getDoc(doc(db, 'listings', listingId));
            if (!listingDoc.exists()) return;
            const listingData = listingDoc.data() as Listing;
            const sellerId = listingData.authorId;

            if (sellerId === user.uid) {
              toast.error("You cannot chat with yourself.");
              return;
            }

            // Check if chat already exists
            const existingChat = chatData.find(c => 
              c.participants.includes(sellerId) && c.listingId === listingId
            );

            if (existingChat) {
              setSelectedChatId(existingChat.id);
              navigate(`/messages?chatId=${existingChat.id}`, { replace: true });
            } else {
              // Create new chat
              const newChatData = {
                participants: [user.uid, sellerId],
                listingId,
                lastMessage: '',
                updatedAt: new Date().toISOString(),
                createdAt: new Date().toISOString()
              };
              const chatRef = await addDoc(collection(db, 'chats'), newChatData);
              setSelectedChatId(chatRef.id);
              navigate(`/messages?chatId=${chatRef.id}`, { replace: true });
            }
          } catch (error) {
            console.error("Error initiating chat:", error);
          }
        };
        initiateChat();
      }
    }, (error) => {
      handleGeneralError(error, 'Error fetching chats');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, searchParams, navigate, selectedChatId]);

  // Fetch messages for the selected chat
  useEffect(() => {
    if (!selectedChatId) {
      setMessages([]);
      setSelectedChatUser(null);
      return;
    }

    const messagesQuery = query(
      collection(db, `chats/${selectedChatId}/messages`),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const msgData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      setMessages(msgData);
    });

    // Get other user info for header
    const chat = chats.find(c => c.id === selectedChatId);
    if (chat?.otherUser) {
      setSelectedChatUser(chat.otherUser);
    } else if (selectedChatId) {
      // Fallback if chat list hasn't loaded yet
      const fetchOtherUser = async () => {
        const chatDoc = await getDoc(doc(db, 'chats', selectedChatId));
        if (chatDoc.exists()) {
          const data = chatDoc.data() as Chat;
          const otherUserId = data.participants.find(p => p !== user?.uid);
          if (otherUserId) {
            const userDoc = await getDoc(doc(db, 'users', otherUserId));
            if (userDoc.exists()) {
              setSelectedChatUser(userDoc.data() as User);
            }
          }
        }
      };
      fetchOtherUser();
    }

    return () => unsubscribe();
  }, [selectedChatId, chats, user]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedChatId || !newMessage.trim()) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    try {
      const messageData = {
        chatId: selectedChatId,
        senderId: user.uid,
        text: messageText,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, `chats/${selectedChatId}/messages`), messageData);
      
      // Update chat's last message and timestamp
      await updateDoc(doc(db, 'chats', selectedChatId), {
        lastMessage: messageText,
        updatedAt: new Date().toISOString()
      });

      // Notify recipient
      const currentChat = chats.find(c => c.id === selectedChatId);
      if (currentChat?.otherUser?.uid) {
        await sendNotification(
          currentChat.otherUser.uid,
          'New Message',
          `${user.displayName}: ${messageText.length > 50 ? messageText.substring(0, 50) + '...' : messageText}`,
          'info',
          `/messages?chatId=${selectedChatId}`
        );
      }
    } catch (error: any) {
      toast.error('Failed to send message: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="animate-pulse text-gray-500 dark:text-gray-400">Loading your conversations...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-120px)]">
      <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-xl border border-gray-100 dark:border-neutral-800 h-full overflow-hidden flex transition-colors">
        
        {/* Sidebar: Chat List */}
        <div className={`w-full md:w-80 lg:w-96 border-r border-gray-100 dark:border-neutral-800 flex flex-col ${selectedChatId ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-6 border-bottom border-gray-100 dark:border-neutral-800">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Messages</h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search chats..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-neutral-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary transition-colors"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {chats.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No conversations yet.</p>
              </div>
            ) : (
              chats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => {
                    setSelectedChatId(chat.id);
                    navigate(`/messages?chatId=${chat.id}`, { replace: true });
                  }}
                  className={`w-full p-4 flex items-center space-x-4 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors border-l-4 ${
                    selectedChatId === chat.id ? 'bg-gray-50 dark:bg-neutral-800 border-primary' : 'border-transparent'
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    {chat.otherUser?.photoURL ? (
                      <img src={chat.otherUser.photoURL} alt="" className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-neutral-700 flex items-center justify-center text-gray-400">
                        <UserIcon className="w-6 h-6" />
                      </div>
                    )}
                    {/* Online Status Placeholder */}
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-neutral-900 rounded-full"></div>
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex justify-between items-baseline">
                      <h3 className="font-bold text-gray-900 dark:text-white truncate">
                        {chat.otherUser?.displayName || 'Unknown User'}
                      </h3>
                      <span className="text-[10px] text-gray-400 uppercase">
                        {chat.updatedAt ? formatDistanceToNow(new Date(chat.updatedAt), { addSuffix: false }) : ''}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {chat.lastMessage || 'No messages yet'}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col bg-gray-50/50 dark:bg-neutral-950/50 ${!selectedChatId ? 'hidden md:flex' : 'flex'}`}>
          {selectedChatId ? (
            <>
              {/* Chat Header */}
              <div className="p-4 bg-white dark:bg-neutral-900 border-b border-gray-100 dark:border-neutral-800 flex items-center justify-between transition-colors">
                <div className="flex items-center space-x-4">
                  <button 
                    onClick={() => {
                      setSelectedChatId(null);
                      navigate('/messages', { replace: true });
                    }}
                    className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="flex items-center space-x-3">
                    {selectedChatUser?.photoURL ? (
                      <img src={selectedChatUser.photoURL} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center text-gray-400">
                        <UserIcon className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">{selectedChatUser?.displayName || 'Chat'}</h3>
                      <p className="text-xs text-green-500 font-medium">Online</p>
                    </div>
                  </div>
                </div>
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full text-gray-400">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((msg, index) => {
                  const isMe = msg.senderId === user?.uid;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] px-4 py-3 rounded-2xl shadow-sm ${
                        isMe 
                          ? 'bg-primary text-white rounded-tr-none' 
                          : 'bg-white dark:bg-neutral-800 text-gray-900 dark:text-white rounded-tl-none border border-gray-100 dark:border-neutral-700'
                      }`}>
                        <p className="text-sm leading-relaxed">{msg.text}</p>
                        <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-white/70' : 'text-gray-400'}`}>
                          {msg.createdAt ? formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true }) : ''}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 bg-white dark:bg-neutral-900 border-t border-gray-100 dark:border-neutral-800 transition-colors">
                <form onSubmit={handleSendMessage} className="flex items-center space-x-4">
                  <input 
                    type="text" 
                    placeholder="Type a message..."
                    className="flex-1 px-6 py-3 bg-gray-50 dark:bg-neutral-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary transition-colors"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                  <button 
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="p-3 bg-primary text-white rounded-2xl hover:bg-opacity-90 transition-all disabled:opacity-50"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-20 h-20 bg-gray-100 dark:bg-neutral-900 rounded-full flex items-center justify-center mb-6 text-gray-300 dark:text-neutral-800">
                <MessageSquare className="w-10 h-10" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Your Conversations</h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-xs">
                Select a chat from the sidebar to start messaging with sellers and service providers.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;

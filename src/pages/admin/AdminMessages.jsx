import React, { useState, useEffect } from 'react';
import { messagesService } from '../../services/messages';
import { supabase } from '../../services/supabase';
import { FaEnvelope, FaEnvelopeOpen, FaSync, FaBell } from 'react-icons/fa';
import { formatDate } from '../../utils/helpers';
import Loader from '../../components/common/Loader';
import toast from 'react-hot-toast';

const AdminMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [realtimeStatus, setRealtimeStatus] = useState('connecting');

  useEffect(() => {
    fetchMessages();

    // Set up realtime subscription for messages
    console.log('📡 Setting up realtime subscription for messages page...');

    const messagesChannel = supabase
      .channel('messages-page-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          console.log('🔔 Messages page realtime event:', payload);
          
          setMessages(currentMessages => {
            let updatedMessages;
            
            switch (payload.eventType) {
              case 'INSERT':
                updatedMessages = [payload.new, ...currentMessages];
                toast.success('New message received!', {
                  icon: '📧',
                  duration: 4000
                });
                break;
                
              case 'UPDATE':
                updatedMessages = currentMessages.map(msg => 
                  msg.id === payload.new.id ? payload.new : msg
                );
                if (selectedMessage?.id === payload.new.id) {
                  setSelectedMessage(payload.new);
                }
                break;
                
              case 'DELETE':
                updatedMessages = currentMessages.filter(msg => msg.id !== payload.old.id);
                if (selectedMessage?.id === payload.old.id) {
                  setSelectedMessage(null);
                }
                break;
                
              default:
                updatedMessages = currentMessages;
            }
            
            return updatedMessages;
          });
        }
      )
      .subscribe((status) => {
        console.log('📡 Messages page channel status:', status);
        setRealtimeStatus(status);
      });

    return () => {
      supabase.removeChannel(messagesChannel);
    };
  }, [selectedMessage]);

  const fetchMessages = async () => {
    setRefreshing(true);
    const { data } = await messagesService.getAll();
    setMessages(data || []);
    setLoading(false);
    setRefreshing(false);
  };

  const markAsRead = async (id) => {
    await messagesService.markAsRead(id);
    // Realtime will update automatically
  };

  if (loading) return <Loader />;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Contact Messages</h1>
            {realtimeStatus === 'SUBSCRIBED' && (
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Live
              </span>
            )}
          </div>
          <p className="text-gray-500">Total: {messages.length} messages</p>
        </div>
        <button
          onClick={fetchMessages}
          className="btn-secondary flex items-center gap-2"
          disabled={refreshing}
        >
          <FaSync className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Messages List */}
        <div className="md:col-span-1 bg-white rounded-lg shadow-md overflow-hidden">
          <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
            {messages.length > 0 ? (
              messages.map((message) => (
                <div
                  key={message.id}
                  onClick={() => {
                    setSelectedMessage(message);
                    if (!message.is_read) markAsRead(message.id);
                  }}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition relative ${
                    selectedMessage?.id === message.id ? 'bg-primary-50' : ''
                  }`}
                >
                  {!message.is_read && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                  )}
                  <div className="flex items-start gap-3">
                    {message.is_read ? (
                      <FaEnvelopeOpen className="text-gray-400 mt-1" />
                    ) : (
                      <FaEnvelope className="text-primary-600 mt-1" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{message.name}</p>
                      <p className="text-sm text-gray-500 truncate">{message.email}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDate(message.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                No messages yet
              </div>
            )}
          </div>
        </div>

        {/* Message Detail */}
        <div className="md:col-span-2 bg-white rounded-lg shadow-md p-6">
          {selectedMessage ? (
            <div>
              <h2 className="text-xl font-bold mb-2">{selectedMessage.name}</h2>
              <p className="text-gray-600 mb-4">{selectedMessage.email}</p>
              <p className="text-sm text-gray-500 mb-4">
                Received: {formatDate(selectedMessage.created_at)}
              </p>
              <div className="border-t pt-4">
                <p className="text-gray-800 whitespace-pre-wrap">
                  {selectedMessage.message}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-12">
              <FaEnvelope className="text-5xl mx-auto mb-4 text-gray-400" />
              Select a message to view
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminMessages;

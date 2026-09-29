import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, Send, Image as ImageIcon, Camera, X, Play } from 'lucide-react';
import { api } from '../../services/api';
import { DirectMessageItem } from '../../types';
import { AuthErrorBanner, AuthSpinner } from '../auth/AuthFeedback';

interface DirectChatSheetProps {
  peerUserId: string;
  peerName: string;
  onBack: () => void;
}

export const DirectChatSheet: React.FC<DirectChatSheetProps> = ({
  peerUserId,
  peerName,
  onBack,
}) => {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DirectMessageItem[]>([]);
  const [draft, setDraft] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const endRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .startConversation(peerUserId)
      .then(async (conv) => {
        if (!active) return;
        setConversationId(conv.id);
        const msgs = await api.getConversationMessages(conv.id);
        if (active) setMessages(msgs.messages || []);
      })
      .catch((err) => {
        if (active) setErrorMessage(err instanceof Error ? err.message : 'Could not start conversation.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [peerUserId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    if (!isImage && !isVideo) {
      setErrorMessage('Please select a valid image (JPEG/PNG/WebP/GIF) or video (MP4/MOV/WebM).');
      return;
    }

    if (isImage && file.size > 5 * 1024 * 1024) {
      setErrorMessage('Photo must be 5 MB or smaller.');
      return;
    }

    if (isVideo && file.size > 50 * 1024 * 1024) {
      setErrorMessage('Video must be 50 MB or smaller.');
      return;
    }

    setErrorMessage(null);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleClearSelectedFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conversationId) return;
    const text = draft.trim();
    if (!text && !selectedFile) return;

    setErrorMessage(null);
    setIsUploading(true);

    try {
      let mediaUrl: string | undefined;
      let mediaType: 'IMAGE' | 'VIDEO' | 'NONE' = 'NONE';
      let mimeType: string | undefined;

      if (selectedFile) {
        const uploadRes = await api.uploadMediaFiles([selectedFile]);
        const uploaded = uploadRes.files[0];
        if (uploaded) {
          mediaUrl = uploaded.url;
          mimeType = uploaded.contentType;
          mediaType = selectedFile.type.startsWith('video/') ? 'VIDEO' : 'IMAGE';
        }
      }

      await api.sendConversationMessage(conversationId, {
        text: text || undefined,
        mediaUrl,
        mediaType,
        mimeType,
      });

      setDraft('');
      handleClearSelectedFile();
      const updated = await api.getConversationMessages(conversationId);
      setMessages(updated.messages || []);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Could not send message.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="h-full bg-white flex flex-col">
      <header className="h-[60px] px-4 flex items-center gap-3 border-b border-[#E1E1E1] shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="size-9 rounded-[18px] flex items-center justify-center touch-manipulation hover:bg-[#F5F5F5]"
          aria-label="Go back"
        >
          <ChevronLeft className="size-5 text-[#09003B]" />
        </button>
        <div className="min-w-0">
          <p className="text-sm font-bold text-[#09003B] truncate">{peerName}</p>
          <p className="text-[11px] text-[#64748B]">Safety Circle 1-on-1</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        <AuthErrorBanner message={errorMessage} />
        {loading ? (
          <div className="py-12 flex justify-center">
            <AuthSpinner />
          </div>
        ) : messages.length === 0 ? (
          <div className="py-16 text-center text-xs text-[#888887]">
            Start a direct message with {peerName}.
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={`flex ${message.isMine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl p-3 shadow-2xs ${
                  message.isMine ? 'bg-[#3A67D5] text-white' : 'bg-[#F5F5F5] text-[#09003B]'
                }`}
              >
                {/* Render Media */}
                {message.mediaUrl && message.mediaType === 'IMAGE' && (
                  <div
                    onClick={() => setLightboxUrl(message.mediaUrl || null)}
                    className="rounded-xl overflow-hidden mb-1.5 cursor-pointer max-h-56 bg-black/5"
                  >
                    <img
                      src={message.mediaUrl}
                      alt="Shared"
                      className="w-full h-auto object-cover max-h-56 rounded-xl hover:opacity-95"
                      loading="lazy"
                    />
                  </div>
                )}

                {message.mediaUrl && message.mediaType === 'VIDEO' && (
                  <div className="rounded-xl overflow-hidden mb-1.5 max-h-64 bg-black">
                    <video
                      src={message.mediaUrl}
                      controls
                      className="w-full max-h-64 rounded-xl"
                      preload="metadata"
                    />
                  </div>
                )}

                {message.text && <p className="text-sm leading-5 whitespace-pre-wrap">{message.text}</p>}
                <p
                  className={`text-[9px] text-right mt-1 ${
                    message.isMine ? 'text-white/70' : 'text-[#888887]'
                  }`}
                >
                  {message.createdAt ? new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>

      {/* Media Attachment Preview */}
      {previewUrl && selectedFile && (
        <div className="px-4 py-2 bg-[#F8FAFC] border-t border-[#E1E1E1] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            {selectedFile.type.startsWith('image/') ? (
              <img src={previewUrl} alt="Preview" className="size-12 rounded-lg object-cover border" />
            ) : (
              <div className="size-12 rounded-lg bg-black text-white flex items-center justify-center">
                <Play className="size-5" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#09003B] truncate">{selectedFile.name}</p>
              <p className="text-[10px] text-[#64748B]">
                {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB · Ready to send
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClearSelectedFile}
            className="p-1 rounded-full text-[#64748B] hover:bg-gray-200"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={handleSelectFile}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleSelectFile}
      />

      <form onSubmit={handleSend} className="p-3 bg-white flex items-center gap-1.5 border-t border-[#E1E1E1]">
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          disabled={isUploading}
          className="size-10 rounded-full text-[#64748B] hover:text-[#3A67D5] hover:bg-[#F1F5F9] flex items-center justify-center touch-manipulation disabled:opacity-50"
          title="Take Photo"
        >
          <Camera className="size-5" />
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="size-10 rounded-full text-[#64748B] hover:text-[#3A67D5] hover:bg-[#F1F5F9] flex items-center justify-center touch-manipulation disabled:opacity-50"
          title="Upload Photo or Video"
        >
          <ImageIcon className="size-5" />
        </button>

        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={isUploading ? 'Uploading media…' : 'Type message...'}
          disabled={isUploading}
          className="flex-1 h-11 rounded-full bg-[#F5F5F5] border border-[#E1E1E1] px-4 text-xs text-[#09003B] placeholder-gray-400 focus:outline-none focus:border-[#3A67D5] disabled:opacity-50"
        />

        <button
          type="submit"
          disabled={isUploading || (!draft.trim() && !selectedFile)}
          className="size-11 rounded-full bg-[#3A67D5] hover:bg-[#2F54B5] text-white flex items-center justify-center touch-manipulation disabled:opacity-40 shadow-xs"
          aria-label="Send"
        >
          {isUploading ? <AuthSpinner /> : <Send className="size-4" />}
        </button>
      </form>

      {/* Lightbox Modal */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-60 bg-black/85 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 text-white hover:bg-white/30"
          >
            <X className="size-6" />
          </button>
          <img
            src={lightboxUrl}
            alt="Fullscreen"
            className="max-w-full max-h-[85vh] rounded-xl object-contain shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};

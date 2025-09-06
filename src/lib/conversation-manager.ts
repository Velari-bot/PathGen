import { db } from '@/lib/firebase-admin';
import { Conversation } from '@/types/ai-coaching';

export class ConversationManager {
  /**
   * Create a new conversation
   */
  static async createConversation(userId: string): Promise<string> {
    try {
      const conversationRef = db.collection('conversations').doc();
      const chatId = conversationRef.id;

      const conversation: Conversation = {
        chatId,
        userId,
        messages: [],
        createdAt: new Date(),
        lastUpdated: new Date(),
        messageCount: 0
      };

      await conversationRef.set(conversation);
      return chatId;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }

  /**
   * Get conversation by ID
   */
  static async getConversation(chatId: string): Promise<Conversation | null> {
    try {
      const conversationRef = db.collection('conversations').doc(chatId);
      const conversationSnap = await conversationRef.get();

      if (!conversationSnap.exists) {
        return null;
      }

      return conversationSnap.data() as Conversation;
    } catch (error) {
      console.error('Error getting conversation:', error);
      throw error;
    }
  }

  /**
   * Get all conversations for a user
   */
  static async getUserConversations(userId: string): Promise<Conversation[]> {
    try {
      const conversationsRef = db.collection('conversations')
        .where('userId', '==', userId)
        .orderBy('lastUpdated', 'desc')
        .limit(50);

      const conversationsSnap = await conversationsRef.get();
      const conversations: Conversation[] = [];

      conversationsSnap.forEach(doc => {
        conversations.push(doc.data() as Conversation);
      });

      return conversations;
    } catch (error) {
      console.error('Error getting user conversations:', error);
      throw error;
    }
  }

  /**
   * Add message to conversation
   */
  static async addMessage(
    chatId: string,
    role: 'user' | 'assistant',
    content: string,
    aiResponse?: any
  ): Promise<void> {
    try {
      const conversationRef = db.collection('conversations').doc(chatId);
      const conversationSnap = await conversationRef.get();

      if (!conversationSnap.exists) {
        throw new Error('Conversation not found');
      }

      const conversation = conversationSnap.data() as Conversation;
      const newMessage = {
        role,
        content,
        timestamp: new Date(),
        ...(aiResponse && { aiResponse })
      };

      await conversationRef.update({
        messages: [...conversation.messages, newMessage],
        lastUpdated: new Date(),
        messageCount: conversation.messageCount + 1
      });
    } catch (error) {
      console.error('Error adding message to conversation:', error);
      throw error;
    }
  }

  /**
   * Delete conversation
   */
  static async deleteConversation(chatId: string): Promise<void> {
    try {
      const conversationRef = db.collection('conversations').doc(chatId);
      await conversationRef.delete();
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw error;
    }
  }

  /**
   * Update conversation metadata
   */
  static async updateConversationMetadata(
    chatId: string,
    metadata: Partial<Conversation>
  ): Promise<void> {
    try {
      const conversationRef = db.collection('conversations').doc(chatId);
      await conversationRef.update({
        ...metadata,
        lastUpdated: new Date()
      });
    } catch (error) {
      console.error('Error updating conversation metadata:', error);
      throw error;
    }
  }
}

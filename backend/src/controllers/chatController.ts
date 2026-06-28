import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { ChatSession } from '../models/ChatSession';
import { analyzeSymptoms } from '../services/aiService';

export const getSessions = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const sessions = await ChatSession.find({ userId });
    res.status(200).json(sessions);
  } catch (error) {
    console.error('Get Sessions Error:', error);
    res.status(500).json({ message: 'Failed to fetch consultation history.' });
  }
};

export const getSessionById = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const session = await ChatSession.findById(id);
    if (!session) {
      return res.status(404).json({ message: 'Consultation not found.' });
    }

    if (session.userId !== userId) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    res.status(200).json(session);
  } catch (error) {
    console.error('Get Session Detail Error:', error);
    res.status(500).json({ message: 'Failed to fetch consultation details.' });
  }
};

export const createSession = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { title, initialMessage } = req.body;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    let finalTitle = title || 'New Consultation';
    const messages: any[] = [];

    // If an initial user message is sent, we can seed the chat history
    if (initialMessage) {
      messages.push({
        role: 'user',
        content: initialMessage,
        timestamp: new Date()
      });

      // Generate a smart title based on the first few words
      if (!title) {
        const words = initialMessage.split(' ');
        finalTitle = words.slice(0, 4).join(' ') + (words.length > 4 ? '...' : '');
      }
    }

    const session = await ChatSession.create({
      userId,
      title: finalTitle,
      messages,
      symptoms: [],
    });

    // If there's an initial message, run it through AI immediately so the user gets a starting response
    if (initialMessage) {
      const aiResponse = await analyzeSymptoms(messages);
      
      const updatedMessages = [
        ...messages,
        {
          role: 'assistant',
          content: aiResponse.reply,
          timestamp: new Date()
        }
      ];

      const updatedSession = await ChatSession.findByIdAndUpdate(session._id, {
        messages: updatedMessages,
        symptoms: aiResponse.summary?.symptomsDetected || [],
        summary: aiResponse.summary
      });

      return res.status(201).json(updatedSession);
    }

    res.status(201).json(session);
  } catch (error) {
    console.error('Create Session Error:', error);
    res.status(500).json({ message: 'Failed to create new consultation.' });
  }
};

export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { content } = req.body;

    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    if (!content) return res.status(400).json({ message: 'Message content is required.' });

    const session = await ChatSession.findById(id);
    if (!session) {
      return res.status(404).json({ message: 'Consultation not found.' });
    }

    if (session.userId !== userId) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    // Append user message
    const userMessage = {
      role: 'user' as const,
      content,
      timestamp: new Date()
    };

    const currentMessages = [...session.messages, userMessage];

    // Request AI analysis
    const aiResponse = await analyzeSymptoms(currentMessages);

    // Append assistant response
    const assistantMessage = {
      role: 'assistant' as const,
      content: aiResponse.reply,
      timestamp: new Date()
    };

    const finalMessages = [...currentMessages, assistantMessage];

    // Calculate unique symptoms
    const existingSymptoms = session.symptoms || [];
    const newSymptoms = aiResponse.summary?.symptomsDetected || [];
    const uniqueSymptoms = Array.from(new Set([...existingSymptoms, ...newSymptoms]));

    // Smart title generation if title is generic
    let updatedTitle = session.title;
    if (session.title === 'New Consultation' || session.title.trim() === '') {
      const firstUserMsg = finalMessages.find(m => m.role === 'user')?.content || '';
      if (firstUserMsg) {
        const words = firstUserMsg.split(' ');
        updatedTitle = words.slice(0, 4).join(' ') + (words.length > 4 ? '...' : '');
      }
    }

    const updatedSession = await ChatSession.findByIdAndUpdate(session._id, {
      title: updatedTitle,
      messages: finalMessages,
      symptoms: uniqueSymptoms,
      summary: aiResponse.summary || session.summary
    });

    res.status(200).json(updatedSession);
  } catch (error) {
    console.error('Send Message Error:', error);
    res.status(500).json({ message: 'Failed to process message.' });
  }
};

export const deleteSession = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const session = await ChatSession.findById(id);
    if (!session) {
      return res.status(404).json({ message: 'Consultation not found.' });
    }

    if (session.userId !== userId) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    await ChatSession.deleteOne({ _id: id, userId });
    res.status(200).json({ message: 'Consultation deleted successfully.' });
  } catch (error) {
    console.error('Delete Session Error:', error);
    res.status(500).json({ message: 'Failed to delete consultation.' });
  }
};

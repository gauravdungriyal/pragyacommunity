<?php
// ==========================================================
// Message & Chat Controller
// Pragya Connect PHP Backend
// ==========================================================

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../helpers/response.php';

class MessageController {

    private static function formatMessage(array $msg): array {
        $attachments = $msg['attachments'] ?? '[]';
        if (is_string($attachments)) {
            $attachments = json_decode($attachments, true) ?: [];
        }

        $reactions = $msg['reactions'] ?? '[]';
        if (is_string($reactions)) {
            $reactions = json_decode($reactions, true) ?: [];
        }

        return [
            'id' => (int)$msg['id'],
            '_id' => (string)$msg['id'],
            'sender' => $msg['sender'],
            'recipient' => $msg['recipient'],
            'text' => $msg['text'] ?? '',
            'attachments' => $attachments,
            'reactions' => $reactions,
            'is_read' => (bool)$msg['is_read'],
            'pinned' => (bool)$msg['pinned'],
            'starred' => (bool)$msg['starred'],
            'reply_to' => $msg['reply_to'] ? (int)$msg['reply_to'] : null,
            'created_at' => $msg['created_at'],
            'createdAt' => $msg['created_at'],
            'updated_at' => $msg['updated_at']
        ];
    }

    /**
     * Get chat history between two users
     */
    public static function getHistory(): void {
        $user1 = $_GET['user1'] ?? '';
        $user2 = $_GET['user2'] ?? '';

        if (empty($user1) || empty($user2)) {
            sendError('Both user1 and user2 are required', 400);
        }

        $db = Database::getConnection();

        $stmt = $db->prepare("
            SELECT * FROM messages 
            WHERE (sender = :u1 AND recipient = :u2) OR (sender = :u2_2 AND recipient = :u1_2)
            ORDER BY created_at ASC
        ");
        $stmt->execute([
            ':u1' => $user1,
            ':u2' => $user2,
            ':u2_2' => $user2,
            ':u1_2' => $user1
        ]);
        $messages = $stmt->fetchAll();

        $formatted = array_map([self::class, 'formatMessage'], $messages);
        sendJson($formatted);
    }

    /**
     * Get conversation list with partner, last message, unread count
     */
    public static function getConversations(): void {
        $user = $_GET['user'] ?? '';
        if (empty($user)) {
            sendError('User name/email is required', 400);
        }

        $db = Database::getConnection();

        $stmt = $db->prepare("
            SELECT * FROM messages 
            WHERE sender = :u1 OR recipient = :u2
            ORDER BY created_at DESC
        ");
        $stmt->execute([':u1' => $user, ':u2' => $user]);
        $messages = $stmt->fetchAll();

        $conversationsMap = [];

        foreach ($messages as $msg) {
            $partner = ($msg['sender'] === $user) ? $msg['recipient'] : $msg['sender'];

            if (!isset($conversationsMap[$partner])) {
                $attachments = is_string($msg['attachments']) ? json_decode($msg['attachments'], true) : $msg['attachments'];
                $hasAttachments = !empty($attachments);
                $lastMsg = !empty($msg['text']) ? $msg['text'] : ($hasAttachments ? "📎 Attachment" : "");

                $conversationsMap[$partner] = [
                    'partner' => $partner,
                    'lastMessage' => $lastMsg,
                    'timestamp' => $msg['created_at'],
                    'unreadCount' => 0,
                    'pinned' => (bool)$msg['pinned'],
                    'starred' => (bool)$msg['starred'],
                ];
            }

            if ($msg['recipient'] === $user && !(bool)$msg['is_read']) {
                $conversationsMap[$partner]['unreadCount'] += 1;
            }
        }

        sendJson(array_values($conversationsMap));
    }

    /**
     * Send message
     */
    public static function send(): void {
        $data = getJsonInput();
        $sender = trim($data['sender'] ?? '');
        $recipient = trim($data['recipient'] ?? '');
        $text = trim($data['text'] ?? '');
        $attachments = $data['attachments'] ?? [];
        $replyTo = !empty($data['reply_to']) ? intval($data['reply_to']) : null;

        if (empty($sender) || empty($recipient)) {
            sendError('Sender and recipient are required', 400);
        }

        $db = Database::getConnection();

        $stmt = $db->prepare("
            INSERT INTO messages (sender, recipient, text, attachments, reactions, is_read, pinned, starred, reply_to)
            VALUES (:sender, :recipient, :text, :attachments, '[]', 0, 0, 0, :reply_to)
        ");
        $stmt->execute([
            ':sender' => $sender,
            ':recipient' => $recipient,
            ':text' => $text,
            ':attachments' => json_encode($attachments),
            ':reply_to' => $replyTo
        ]);

        $msgId = (int)$db->lastInsertId();

        $fetch = $db->prepare("SELECT * FROM messages WHERE id = :id");
        $fetch->execute([':id' => $msgId]);
        $msg = $fetch->fetch();

        sendJson(self::formatMessage($msg), 201);
    }

    /**
     * Mark conversation messages as read
     */
    public static function markRead(): void {
        $data = getJsonInput();
        $sender = trim($data['sender'] ?? '');
        $recipient = trim($data['recipient'] ?? '');

        $db = Database::getConnection();

        $stmt = $db->prepare("
            UPDATE messages 
            SET is_read = 1 
            WHERE sender = :sender AND recipient = :recipient AND is_read = 0
        ");
        $stmt->execute([':sender' => $sender, ':recipient' => $recipient]);

        sendJson(['message' => 'Messages marked as read']);
    }

    /**
     * Edit message
     */
    public static function edit(int $id): void {
        $data = getJsonInput();
        $text = trim($data['text'] ?? '');

        $db = Database::getConnection();

        $stmt = $db->prepare("UPDATE messages SET text = :text WHERE id = :id");
        $stmt->execute([':text' => $text, ':id' => $id]);

        $fetch = $db->prepare("SELECT * FROM messages WHERE id = :id");
        $fetch->execute([':id' => $id]);
        $msg = $fetch->fetch();

        if (!$msg) {
            sendError('Message not found', 404);
        }

        sendJson(self::formatMessage($msg));
    }

    /**
     * Delete message
     */
    public static function delete(int $id): void {
        $db = Database::getConnection();

        $stmt = $db->prepare("DELETE FROM messages WHERE id = :id");
        $stmt->execute([':id' => $id]);

        sendJson(['message' => 'Message deleted successfully']);
    }

    /**
     * Toggle pin message
     */
    public static function togglePin(int $id): void {
        $db = Database::getConnection();

        $stmt = $db->prepare("UPDATE messages SET pinned = NOT pinned WHERE id = :id");
        $stmt->execute([':id' => $id]);

        $fetch = $db->prepare("SELECT * FROM messages WHERE id = :id");
        $fetch->execute([':id' => $id]);
        $msg = $fetch->fetch();

        if (!$msg) {
            sendError('Message not found', 404);
        }

        sendJson(self::formatMessage($msg));
    }

    /**
     * Toggle star message
     */
    public static function toggleStar(int $id): void {
        $db = Database::getConnection();

        $stmt = $db->prepare("UPDATE messages SET starred = NOT starred WHERE id = :id");
        $stmt->execute([':id' => $id]);

        $fetch = $db->prepare("SELECT * FROM messages WHERE id = :id");
        $fetch->execute([':id' => $id]);
        $msg = $fetch->fetch();

        if (!$msg) {
            sendError('Message not found', 404);
        }

        sendJson(self::formatMessage($msg));
    }

    /**
     * Add/remove reaction
     */
    public static function react(int $id): void {
        $data = getJsonInput();
        $user = trim($data['user'] ?? '');
        $emoji = trim($data['emoji'] ?? '');

        $db = Database::getConnection();

        $fetch = $db->prepare("SELECT * FROM messages WHERE id = :id");
        $fetch->execute([':id' => $id]);
        $msg = $fetch->fetch();

        if (!$msg) {
            sendError('Message not found', 404);
        }

        $reactions = json_decode($msg['reactions'] ?: '[]', true) ?: [];
        $foundIndex = -1;

        foreach ($reactions as $idx => $r) {
            if (($r['user'] ?? '') === $user) {
                $foundIndex = $idx;
                break;
            }
        }

        if ($foundIndex > -1) {
            if ($reactions[$foundIndex]['emoji'] === $emoji) {
                array_splice($reactions, $foundIndex, 1);
            } else {
                $reactions[$foundIndex]['emoji'] = $emoji;
            }
        } else {
            $reactions[] = ['user' => $user, 'emoji' => $emoji];
        }

        $update = $db->prepare("UPDATE messages SET reactions = :reactions WHERE id = :id");
        $update->execute([':reactions' => json_encode($reactions), ':id' => $id]);

        $msg['reactions'] = $reactions;
        sendJson(self::formatMessage($msg));
    }
}

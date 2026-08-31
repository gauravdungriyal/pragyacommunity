<?php
// ==========================================================
// Dashboard Controller
// Pragya Connect PHP Backend
// ==========================================================

require_once __DIR__ . '/../helpers/response.php';

class DashboardController {

    private static array $quotes = [
        [
            'quote' => 'Yoga is the journey of the self, through the self, to the self.',
            'author' => 'The Bhagavad Gita'
        ],
        [
            'quote' => 'Yoga does not just change the way we see things, it transforms the person who sees.',
            'author' => 'B.K.S. Iyengar'
        ],
        [
            'quote' => 'Calming the mind is yoga. Not just standing on the head.',
            'author' => 'Swami Satchidananda'
        ],
        [
            'quote' => 'Undisturbed calmness of mind is attained by cultivating friendliness toward the happy, compassion for the unhappy, delight in the virtuous, and indifference toward the wicked.',
            'author' => 'Patanjali (Yoga Sutras)'
        ],
        [
            'quote' => 'The body benefits from movement, and the mind benefits from stillness.',
            'author' => 'Sakyong Mipham'
        ]
    ];

    /**
     * Get Daily Quote
     */
    public static function getDailyQuote(): void {
        // Deterministic daily quote based on the day of the year
        $dayIndex = (int)date('z') % count(self::$quotes);
        $selected = self::$quotes[$dayIndex];

        sendJson([
            'success' => true,
            'quote' => $selected['quote'],
            'author' => $selected['author']
        ]);
    }
}

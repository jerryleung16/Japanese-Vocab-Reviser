(function () {
    'use strict';

    const maxContextLength = 4000;

    function getCurrentContext() {
        const item = window.getCurrentVocabItem ? window.getCurrentVocabItem() : null;
        if (!item) {
            return null;
        }

        const context = {
            hiragana: String(item.hiragana || '').slice(0, 200),
            kanji: String(item.kanji || '').slice(0, 200),
            definition: String(item.definition || '').slice(0, 800),
            example: String(item.example || '').slice(0, 800),
            translation: String(item.translation || '').slice(0, 800),
            displayedText: String(document.getElementById('frontText')?.textContent || '').slice(0, 200)
        };

        return JSON.stringify(context).slice(0, maxContextLength);
    }

    window.getAgentVocabContext = getCurrentContext;
})();
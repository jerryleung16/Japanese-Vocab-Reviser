(function () {
    'use strict';

    const maxContextLength = 4000;

    function getCurrentContext() {
        const item = window.getCurrentVocabItem ? window.getCurrentVocabItem() : null;
        if (!item) {
            return null;
        }

        const context = {
            id: item.id,
            hiragana: String(item.hiragana || '').slice(0, 200),
            kanji: String(item.kanji || '').slice(0, 200),
            definition: String(item.definition || '').slice(0, 800),
            example: String(item.example || '').slice(0, 800),
            translation: String(item.translation || '').slice(0, 800),
            displayedText: String(document.getElementById('frontText')?.textContent || '').slice(0, 200)
        };

        return JSON.stringify(context).slice(0, maxContextLength);
    }

    function getDraftContext(formName) {
        const prefix = formName === 'edit' ? 'edit' : '';
        const read = (name) => document.getElementById(`${prefix}${name}`)?.value || '';
        const context = {
            draft: true,
            hiragana: String(read('Hiragana') || read('hiraganaInput')).slice(0, 200),
            kanji: String(read('Kanji') || read('kanjiInput')).slice(0, 200),
            definition: String(read('Definition') || read('definitionInput')).slice(0, 800),
            example: String(read('Example') || read('exampleInput')).slice(0, 800),
            translation: String(read('Translation') || read('translationInput')).slice(0, 800),
        };
        return Object.values(context).some((value) => value && value !== true)
            ? JSON.stringify(context).slice(0, maxContextLength)
            : null;
    }

    window.getAgentVocabContext = getCurrentContext;
    window.getAgentDraftContext = getDraftContext;
})();
import re

class GermanAICoachService:
    """
    Powers interactive German learning assistance: Grammar explanations,
    Vocabulary coaching, Pronunciation hints, Translation, Lesson summarization,
    and Goethe / TELC exam prep question generation.
    """

    GRAMMAR_RULES = {
        "akkusativ": "In German, the Akkusativ (accusative case) is used for direct objects and after certain prepositions (durch, für, gegen, ohne, um). Masculine articles change: 'der/ein' -> 'den/einen'. Feminine ('die/eine') and Neuter ('das/ein') remain unchanged.",
        "dativ": "The Dativ (dative case) is used for indirect objects and after dative prepositions (aus, bei, mit, nach, seit, von, zu). Articles change: 'der/das' -> 'dem', 'die' -> 'der', plural 'die' -> 'den' (+n on noun).",
        "perfekt": "The Perfekt tense is formed with an auxiliary verb (haben or sein) + past participle (Partizip II). Verbs of motion or change of state use 'sein' (e.g., 'Ich bin gegangen'). Most other verbs use 'haben' (e.g., 'Ich habe gelernt').",
        "nebensatz": "In subordinate clauses (Nebensätze) introduced by conjunctions like 'weil', 'dass', 'obwohl', or 'wenn', the conjugated verb moves to the very end of the clause.",
        "konjunktiv": "Konjunktiv II is used to express politeness, wishes, or hypothetical situations. Common forms include 'würde + infinitive', 'hätte' (would have), and 'wäre' (would be)."
    }

    VOCAB_COACH = {
        "bieten": "bieten (verb) - to offer. Partizip II: geboten. Example: 'Wir bieten hybride Kurse an.'",
        "erfolg": "der Erfolg (noun, masculine) - success. Plural: die Erfolge. Example: 'Ich wünsche dir viel Erfolg bei der Goethe-Prüfung!'",
        "prüfung": "die Prüfung (noun, feminine) - exam / test. Example: 'Die offizielle Goethe-Zertifikat Prüfung findet am Samstag statt.'",
        "unterricht": "der Unterricht (noun, masculine) - class / instruction. Example: 'Der Deutschunterricht beginnt um 8:30 Uhr.'"
    }

    @classmethod
    def assist(cls, intent, prompt, lesson_context=None, level_code="B1.1"):
        prompt_lower = prompt.lower()

        if intent == "GRAMMAR" or any(w in prompt_lower for w in ["grammar", "grammatik", "case", "akkusativ", "dativ", "perfekt", "clause"]):
            for k, rule in cls.GRAMMAR_RULES.items():
                if k in prompt_lower:
                    return {
                        "intent": "GRAMMAR_EXPLANATION",
                        "topic": k.capitalize(),
                        "response": rule,
                        "level": level_code
                    }
            return {
                "intent": "GRAMMAR_EXPLANATION",
                "topic": "General German Syntax",
                "response": f"At {level_code} level, always ensure correct sentence bracket structure (Satzklammer). Main clauses place the conjugated verb in position 2, while subordinate clauses place it at the end.",
                "level": level_code
            }

        elif intent == "VOCABULARY" or any(w in prompt_lower for w in ["vocab", "wortschatz", "mean", "meaning", "define"]):
            for k, entry in cls.VOCAB_COACH.items():
                if k in prompt_lower:
                    return {
                        "intent": "VOCABULARY_COACH",
                        "word": k,
                        "response": entry,
                        "level": level_code
                    }
            return {
                "intent": "VOCABULARY_COACH",
                "word": prompt,
                "response": f"Vocabulary tip for {level_code}: Always memorize German nouns with their definite article (der/die/das) and plural form.",
                "level": level_code
            }

        elif intent == "TRANSLATE" or any(w in prompt_lower for w in ["translate", "übersetzen", "english to german", "german to english"]):
            return {
                "intent": "TRANSLATION",
                "original": prompt,
                "response": f"[AI Certified Translation for {level_code}]: 'Willkommen bei der Horizon Deutsch-Lernplattform. Wir unterstützen physisches, virtuelles und hybrides Lernen.' (Welcome to the Horizon German Learning Platform. We support physical, virtual, and hybrid learning.)",
                "level": level_code
            }

        elif intent == "EXAM_PREP" or any(w in prompt_lower for w in ["goethe", "telc", "exam", "mock", "test", "practice"]):
            return {
                "intent": "EXAM_PREPARATION",
                "exam_type": "Goethe-Zertifikat / TELC",
                "response": f"Here is a mock practice exercise for level {level_code}:\n\n**Leseverstehen (Reading Comprehension)**:\nRead the passage: 'In Deutschland öffnen viele Geschäfte montags bis samstags von 9:00 bis 20:00 Uhr.'\n*Question*: Haben die Geschäfte sonntags geöffnet?\n*Answer Options*:\nA) Ja, den ganzen Tag.\nB) Nein, sonntags sind sie geschlossen.\nC) Nur vormittags.\n*(Correct: B)*",
                "level": level_code
            }

        elif intent == "SUMMARIZE" or any(w in prompt_lower for w in ["summarize", "zusammenfassen", "lesson", "summary"]):
            summary_text = lesson_context if lesson_context else "This lesson focuses on mastering German communicative competences, vocabulary expansion, and structural grammar rules suited for formal examination standards."
            return {
                "intent": "LESSON_SUMMARY",
                "response": f"**Key Takeaways ({level_code})**:\n1. Core vocabulary mastered for real-world scenarios.\n2. Key grammatical structures demonstrated in authentic dialogues.\n3. Ready for interactive exercises and discussion board participation.",
                "level": level_code
            }

        else:
            return {
                "intent": "GENERAL_ASSISTANT",
                "response": f"Hallo! I am your Horizon German AI Learning Assistant tailored for {level_code}. Ask me to explain grammar rules, translate texts, generate Goethe/TELC mock questions, or summarize lesson materials!",
                "level": level_code
            }

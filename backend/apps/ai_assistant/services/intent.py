import re

class IntentClassifier:
    """
    Classifies user queries into enterprise institutional categories before generation.
    Supports: FINANCE, ADMISSIONS, ODEL, ATTENDANCE, COMMUNICATION, CERTIFICATES, SYSTEM_HELP, GENERAL_CONVERSATION.
    """

    INTENT_KEYWORDS = {
        "FINANCE": [
            "balance", "fee", "pay", "statement", "receipt", "money", "cost", 
            "owe", "invoice", "tuition", "refund", "mpesa", "ledger", "arrears", "installment"
        ],
        "ADMISSIONS": [
            "admission", "applicant", "apply", "enroll", "intake", "join", 
            "requirement", "register", "eligibility", "deadline", "application"
        ],
        "ODEL": [
            "odel", "zoom", "online", "lms", "recording", "assignment", "submission", 
            "course material", "download resource", "virtual class", "moodle", "link to class"
        ],
        "ATTENDANCE": [
            "attendance", "absent", "present", "missed class", "attend", "session log", "truancy"
        ],
        "COMMUNICATION": [
            "announcement", "message", "memo", "notice", "notify", "broadcast", "circular", "contact staff"
        ],
        "CERTIFICATES": [
            "certificate", "cert", "goethe", "graduate", "exam", "result", "transcript", 
            "mark", "grade", "score", "pass", "a1", "a2", "b1", "b2", "c1", "c2", "zertifikat", "prüfung"
        ],
        "SYSTEM_HELP": [
            "password", "login", "forgot", "reset", "navigate", "dashboard", 
            "how to use", "account locked", "portal help", "support ticket"
        ]
    }

    @classmethod
    def classify(cls, question: str) -> str:
        if not question or not question.strip():
            return "GENERAL_CONVERSATION"

        q_lower = question.lower()

        # Score categories based on keyword match count and exact phrase matches
        scores = {}
        for intent, keywords in cls.INTENT_KEYWORDS.items():
            score = 0
            for kw in keywords:
                # Use regex word boundaries for short keywords
                if len(kw) <= 3:
                    if re.search(rf'\b{re.escape(kw)}\b', q_lower):
                        score += 2
                else:
                    if kw in q_lower:
                        score += 2 if len(kw) > 5 else 1
            if score > 0:
                scores[intent] = score

        if not scores:
            return "GENERAL_CONVERSATION"

        # Return intent with highest score
        best_intent = max(scores.items(), key=lambda x: x[1])[0]
        return best_intent

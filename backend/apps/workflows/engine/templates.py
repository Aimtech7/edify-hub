import json

ENTERPRISE_WORKFLOW_TEMPLATES = [
    {
        "name": "Enterprise Admissions Automation",
        "description": "Automates the student onboarding pipeline from Application Submitted to AI Welcome Assistant.",
        "category": "Admissions",
        "trigger_type": "EVENT",
        "trigger_event": "Student Applied",
        "status": "ACTIVE",
        "definition_json": {
            "nodes": [
                {"id": "node_1", "type": "Start", "label": "Application Submitted"},
                {"id": "node_2", "type": "Approval", "label": "Admissions Review", "config": {"target_role": "admissions", "title": "Review Student Application"}},
                {"id": "node_3", "type": "Database Update", "label": "Interview Scheduling", "config": {"table": "AdmissionsInterview"}},
                {"id": "node_4", "type": "Decision", "label": "Interview Outcome Check", "config": {"field": "interview_passed", "op": "==", "val": True}},
                {"id": "node_5", "type": "Document Generation", "label": "Generate Offer Letter", "config": {"doc_type": "OfferLetter"}},
                {"id": "node_6", "type": "Condition", "label": "Offer Accepted?", "config": {"field": "accepted", "op": "==", "val": True}},
                {"id": "node_7", "type": "Database Update", "label": "Create Student Record", "config": {"table": "Student"}},
                {"id": "node_8", "type": "Database Update", "label": "Create Portal Account", "config": {"table": "User"}},
                {"id": "node_9", "type": "Notification", "label": "Send Welcome Email", "config": {"channel": "Email", "recipient": "Applicant"}},
                {"id": "node_10", "type": "Database Update", "label": "Assign Communication Group", "config": {"table": "CommunicationGroup"}},
                {"id": "node_11", "type": "Database Update", "label": "Assign Fee Structure", "config": {"table": "FeeStructure"}},
                {"id": "node_12", "type": "Database Update", "label": "Generate Timetable", "config": {"table": "Timetable"}},
                {"id": "node_13", "type": "AI Action", "label": "AI Welcome Assistant Setup", "config": {"task": "Initialize AI study roadmap"}},
                {"id": "node_14", "type": "End", "label": "Admissions Pipeline Complete"}
            ],
            "edges": [
                {"source": "node_1", "target": "node_2"},
                {"source": "node_2", "target": "node_3", "label": "approved"},
                {"source": "node_3", "target": "node_4"},
                {"source": "node_4", "target": "node_5", "label": "true"},
                {"source": "node_5", "target": "node_6"},
                {"source": "node_6", "target": "node_7", "label": "true"},
                {"source": "node_7", "target": "node_8"},
                {"source": "node_8", "target": "node_9"},
                {"source": "node_9", "target": "node_10"},
                {"source": "node_10", "target": "node_11"},
                {"source": "node_11", "target": "node_12"},
                {"source": "node_12", "target": "node_13"},
                {"source": "node_13", "target": "node_14"}
            ]
        }
    },
    {
        "name": "Enterprise Finance ERP Reconciliation",
        "description": "Automates payment validation, receipt generation, ledger allocations, and multi-channel notifications.",
        "category": "Finance",
        "trigger_type": "EVENT",
        "trigger_event": "Payment Received",
        "status": "ACTIVE",
        "definition_json": {
            "nodes": [
                {"id": "fin_1", "type": "Start", "label": "Payment Received"},
                {"id": "fin_2", "type": "Decision", "label": "Validate Transaction", "config": {"field": "amount", "op": ">", "val": 0}},
                {"id": "fin_3", "type": "Database Update", "label": "Create Ledger Entry", "config": {"table": "FinanceLedger"}},
                {"id": "fin_4", "type": "Document Generation", "label": "Generate Receipt Number", "config": {"doc_type": "OfficialReceipt"}},
                {"id": "fin_5", "type": "Payment", "label": "Allocate Payment to Invoices"},
                {"id": "fin_6", "type": "Database Update", "label": "Update Student Balance"},
                {"id": "fin_7", "type": "Database Update", "label": "Update Fee Statement"},
                {"id": "fin_8", "type": "Notification", "label": "Notify Student Receipt", "config": {"channel": "Hub & Email", "recipient": "Student"}},
                {"id": "fin_9", "type": "Notification", "label": "Notify Parent Portal", "config": {"channel": "Portal", "recipient": "Parent"}},
                {"id": "fin_10", "type": "Notification", "label": "Notify Finance Team", "config": {"channel": "Internal Hub", "recipient": "Accountant"}},
                {"id": "fin_11", "type": "Database Update", "label": "Write Audit Log Entry", "config": {"table": "AuditLog"}},
                {"id": "fin_12", "type": "End", "label": "Payment Reconciled"}
            ],
            "edges": [
                {"source": "fin_1", "target": "fin_2"},
                {"source": "fin_2", "target": "fin_3", "label": "true"},
                {"source": "fin_3", "target": "fin_4"},
                {"source": "fin_4", "target": "fin_5"},
                {"source": "fin_5", "target": "fin_6"},
                {"source": "fin_6", "target": "fin_7"},
                {"source": "fin_7", "target": "fin_8"},
                {"source": "fin_8", "target": "fin_9"},
                {"source": "fin_9", "target": "fin_10"},
                {"source": "fin_10", "target": "fin_11"},
                {"source": "fin_11", "target": "fin_12"}
            ]
        }
    },
    {
        "name": "Academic Onboarding & Progression",
        "description": "Orchestrates course enrollment, CEFR placement, class grouping, and LMS access.",
        "category": "Academic",
        "trigger_type": "EVENT",
        "trigger_event": "Course Enrolled",
        "status": "ACTIVE",
        "definition_json": {
            "nodes": [
                {"id": "acad_1", "type": "Start", "label": "Student Enrolled"},
                {"id": "acad_2", "type": "Database Update", "label": "Assign CEFR Level", "config": {"table": "CEFRLevel"}},
                {"id": "acad_3", "type": "Database Update", "label": "Assign Teacher & Instructor"},
                {"id": "acad_4", "type": "Database Update", "label": "Assign Class & Cohort"},
                {"id": "acad_5", "type": "Database Update", "label": "Create Course Discussions"},
                {"id": "acad_6", "type": "Database Update", "label": "Grant Lesson Access"},
                {"id": "acad_7", "type": "Notification", "label": "Notify Student Enrollment", "config": {"recipient": "Student"}},
                {"id": "acad_8", "type": "End", "label": "Academic Setup Complete"}
            ],
            "edges": [
                {"source": "acad_1", "target": "acad_2"},
                {"source": "acad_2", "target": "acad_3"},
                {"source": "acad_3", "target": "acad_4"},
                {"source": "acad_4", "target": "acad_5"},
                {"source": "acad_5", "target": "acad_6"},
                {"source": "acad_6", "target": "acad_7"},
                {"source": "acad_7", "target": "acad_8"}
            ]
        }
    },
    {
        "name": "ODEL Lesson Publishing & AI Indexing",
        "description": "Automates storage indexing, metadata extraction, vector embedding, and student notification.",
        "category": "Lesson",
        "trigger_type": "EVENT",
        "trigger_event": "Lesson Uploaded",
        "status": "ACTIVE",
        "definition_json": {
            "nodes": [
                {"id": "less_1", "type": "Start", "label": "Teacher Uploads Lesson"},
                {"id": "less_2", "type": "Database Update", "label": "Upload to Supabase Storage"},
                {"id": "less_3", "type": "AI Action", "label": "Extract Metadata & Keywords", "config": {"task": "Extract lesson syllabus tags"}},
                {"id": "less_4", "type": "AI Action", "label": "Index for Horizon AI Vector KB", "config": {"task": "Vectorize lesson content"}},
                {"id": "less_5", "type": "Database Update", "label": "Publish Lesson to Catalog"},
                {"id": "less_6", "type": "Notification", "label": "Notify Enrolled Students"},
                {"id": "less_7", "type": "Database Update", "label": "Update Progress Tracker"},
                {"id": "less_8", "type": "Database Update", "label": "Create Discussion Thread"},
                {"id": "less_9", "type": "End", "label": "Lesson Live & Indexed"}
            ],
            "edges": [
                {"source": "less_1", "target": "less_2"},
                {"source": "less_2", "target": "less_3"},
                {"source": "less_3", "target": "less_4"},
                {"source": "less_4", "target": "less_5"},
                {"source": "less_5", "target": "less_6"},
                {"source": "less_6", "target": "less_7"},
                {"source": "less_7", "target": "less_8"},
                {"source": "less_8", "target": "less_9"}
            ]
        }
    },
    {
        "name": "Examination & Result Evaluation Lifecycle",
        "description": "Coordinates exam scheduling, secure PDF unlocking, marking verification, and graduation evaluation.",
        "category": "Exam",
        "trigger_type": "EVENT",
        "trigger_event": "Exam Submitted",
        "status": "ACTIVE",
        "definition_json": {
            "nodes": [
                {"id": "exam_1", "type": "Start", "label": "Exam Submitted by Student"},
                {"id": "exam_2", "type": "Database Update", "label": "Record Submission Timestamp"},
                {"id": "exam_3", "type": "Approval", "label": "Teacher Grading & Marking", "config": {"target_role": "teacher", "title": "Mark Exam Submission"}},
                {"id": "exam_4", "type": "Database Update", "label": "Publish Results"},
                {"id": "exam_5", "type": "Database Update", "label": "Update Student Transcript"},
                {"id": "exam_6", "type": "AI Action", "label": "Evaluate Certificate Eligibility", "config": {"task": "Check CEFR graduation rules"}},
                {"id": "exam_7", "type": "End", "label": "Exam Cycle Complete"}
            ],
            "edges": [
                {"source": "exam_1", "target": "exam_2"},
                {"source": "exam_2", "target": "exam_3"},
                {"source": "exam_3", "target": "exam_4", "label": "approved"},
                {"source": "exam_4", "target": "exam_5"},
                {"source": "exam_5", "target": "exam_6"},
                {"source": "exam_6", "target": "exam_7"}
            ]
        }
    },
    {
        "name": "Secure Certificate & Digital Wallet Verification",
        "description": "Verifies graduation clearance, assigns cryptographic UUIDs and QR codes, and updates wallets.",
        "category": "Certificate",
        "trigger_type": "EVENT",
        "trigger_event": "Certificate Generated",
        "status": "ACTIVE",
        "definition_json": {
            "nodes": [
                {"id": "cert_1", "type": "Start", "label": "Course Completion Trigger"},
                {"id": "cert_2", "type": "Condition", "label": "Check Fee & Attendance Clearance", "config": {"field": "cleared", "op": "==", "val": True}},
                {"id": "cert_3", "type": "Approval", "label": "Registrar Sign-off", "config": {"target_role": "registrar", "title": "Approve Diploma Issuance"}},
                {"id": "cert_4", "type": "Certificate Generation", "label": "Generate Digital Certificate"},
                {"id": "cert_5", "type": "Database Update", "label": "Assign Cryptographic UUID"},
                {"id": "cert_6", "type": "Document Generation", "label": "Generate Verification QR Code", "config": {"doc_type": "QRCode"}},
                {"id": "cert_7", "type": "Database Update", "label": "Store PDF in Supabase Storage"},
                {"id": "cert_8", "type": "Notification", "label": "Notify Student & Email PDF"},
                {"id": "cert_9", "type": "Database Update", "label": "Update Student Digital Wallet"},
                {"id": "cert_10", "type": "End", "label": "Certificate Delivered"}
            ],
            "edges": [
                {"source": "cert_1", "target": "cert_2"},
                {"source": "cert_2", "target": "cert_3", "label": "true"},
                {"source": "cert_3", "target": "cert_4", "label": "approved"},
                {"source": "cert_4", "target": "cert_5"},
                {"source": "cert_5", "target": "cert_6"},
                {"source": "cert_6", "target": "cert_7"},
                {"source": "cert_7", "target": "cert_8"},
                {"source": "cert_8", "target": "cert_9"},
                {"source": "cert_9", "target": "cert_10"}
            ]
        }
    },
    {
        "name": "Omnichannel Communication Dispatcher",
        "description": "Routes system events to Communication Hub, Email, and audit logs based on priority.",
        "category": "Communication",
        "trigger_type": "EVENT",
        "trigger_event": "Broadcast Announcement",
        "status": "ACTIVE",
        "definition_json": {
            "nodes": [
                {"id": "comm_1", "type": "Start", "label": "Event Broadcast Triggered"},
                {"id": "comm_2", "type": "Decision", "label": "High Priority Routing Check", "config": {"field": "priority", "op": "==", "val": "high"}},
                {"id": "comm_3", "type": "Notification", "label": "Send Urgent Hub Broadcast", "config": {"channel": "Hub & Email"}},
                {"id": "comm_4", "type": "Notification", "label": "Send Standard Notification Feed"},
                {"id": "comm_5", "type": "Database Update", "label": "Log Communication Delivery"},
                {"id": "comm_6", "type": "End", "label": "Dispatch Complete"}
            ],
            "edges": [
                {"source": "comm_1", "target": "comm_2"},
                {"source": "comm_2", "target": "comm_3", "label": "true"},
                {"source": "comm_2", "target": "comm_4", "label": "false"},
                {"source": "comm_3", "target": "comm_5"},
                {"source": "comm_4", "target": "comm_5"},
                {"source": "comm_5", "target": "comm_6"}
            ]
        }
    }
]

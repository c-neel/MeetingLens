import sys
import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

def create_presentation():
    prs = Presentation()
    # 16:9 widescreen
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_slide_layout = prs.slide_layouts[6]

    # Color Palette
    BG_COLOR = RGBColor(15, 23, 42)        # Slate 900
    CARD_BG = RGBColor(30, 41, 59)         # Slate 800
    CARD_BORDER = RGBColor(51, 65, 85)     # Slate 700
    ACCENT_BLUE = RGBColor(56, 189, 248)   # Sky 400
    ACCENT_PURPLE = RGBColor(168, 85, 247) # Purple 500
    TEXT_WHITE = RGBColor(248, 250, 252)   # Slate 50
    TEXT_MUTED = RGBColor(148, 163, 184)   # Slate 400
    ACCENT_GREEN = RGBColor(52, 211, 153)  # Emerald 400
    ACCENT_YELLOW = RGBColor(251, 191, 36) # Amber 400

    def set_slide_background(slide):
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
        bg.fill.solid()
        bg.fill.fore_color.rgb = BG_COLOR
        bg.line.fill.background()
        return bg

    def add_header(slide, title_text, category_text="MEETINGLENS • PROJECT PRESENTATION"):
        # Category label
        cat_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(11.7), Inches(0.4))
        tf_c = cat_box.text_frame
        tf_c.word_wrap = True
        p_c = tf_c.paragraphs[0]
        p_c.text = category_text.upper()
        p_c.font.size = Pt(11)
        p_c.font.bold = True
        p_c.font.color.rgb = ACCENT_BLUE

        # Main Title
        title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.7), Inches(11.7), Inches(0.8))
        tf = title_box.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = title_text
        p.font.size = Pt(24)
        p.font.bold = True
        p.font.color.rgb = TEXT_WHITE

    def add_card(slide, left, top, width, height, title=None, title_color=ACCENT_BLUE):
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(left), Inches(top), Inches(width), Inches(height))
        card.fill.solid()
        card.fill.fore_color.rgb = CARD_BG
        card.line.color.rgb = CARD_BORDER
        card.line.width = Pt(1.2)

        if title:
            tb = slide.shapes.add_textbox(Inches(left + 0.25), Inches(top + 0.2), Inches(width - 0.5), Inches(0.5))
            tf = tb.text_frame
            tf.word_wrap = True
            p = tf.paragraphs[0]
            p.text = title
            p.font.size = Pt(15)
            p.font.bold = True
            p.font.color.rgb = title_color
        return card

    # ==================== SLIDE 1: Title Slide ====================
    slide1 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(slide1)

    # Decorative banner card
    add_card(slide1, 1.2, 1.2, 10.933, 5.1)

    tb = slide1.shapes.add_textbox(Inches(1.8), Inches(1.8), Inches(9.7), Inches(3.8))
    tf = tb.text_frame
    tf.word_wrap = True

    p0 = tf.paragraphs[0]
    p0.text = "AI-POWERED MEETING INTELLIGENCE"
    p0.font.size = Pt(13)
    p0.font.bold = True
    p0.font.color.rgb = ACCENT_BLUE
    p0.space_after = Pt(14)

    p1 = tf.add_paragraph()
    p1.text = "MeetingLens"
    p1.font.size = Pt(44)
    p1.font.bold = True
    p1.font.color.rgb = TEXT_WHITE
    p1.space_after = Pt(10)

    p2 = tf.add_paragraph()
    p2.text = "Automated Summarization, Action Item Extraction & Task Delegation Platform"
    p2.font.size = Pt(20)
    p2.font.color.rgb = ACCENT_PURPLE
    p2.space_after = Pt(26)

    p3 = tf.add_paragraph()
    p3.text = "Transforming Spoken Conversations into Structured Knowledge & Verifiable Execution"
    p3.font.size = Pt(14)
    p3.font.color.rgb = TEXT_MUTED
    p3.space_after = Pt(20)

    p4 = tf.add_paragraph()
    p4.text = "Domain: Artificial Intelligence • Natural Language Processing • Full-Stack Web App"
    p4.font.size = Pt(12)
    p4.font.bold = True
    p4.font.color.rgb = ACCENT_GREEN

    # ==================== SLIDE 2: Problem Statement ====================
    slide2 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(slide2)
    add_header(slide2, "Problem Statement: The Meeting Productivity Crisis")

    # 3 Column Cards
    c1 = add_card(slide2, 0.8, 1.6, 3.6, 5.2, "1. Information Loss & Fatigue", ACCENT_YELLOW)
    tb1 = slide2.shapes.add_textbox(Inches(1.0), Inches(2.3), Inches(3.2), Inches(4.2))
    tf1 = tb1.text_frame
    tf1.word_wrap = True
    tf1.paragraphs[0].text = "• 30-60+ minute meetings overwhelm human working memory.\n\n• Crucial context, decisions, and technical reasoning are lost immediately after calls end.\n\n• Audio/video recordings are rarely rewatched due to lack of time."
    for p in tf1.paragraphs:
        p.font.size = Pt(13)
        p.font.color.rgb = TEXT_WHITE

    c2 = add_card(slide2, 4.85, 1.6, 3.6, 5.2, "2. Manual Note-Taking Flaws", ACCENT_YELLOW)
    tb2 = slide2.shapes.add_textbox(Inches(5.05), Inches(2.3), Inches(3.2), Inches(4.2))
    tf2 = tb2.text_frame
    tf2.word_wrap = True
    tf2.paragraphs[0].text = "• Designated note-takers cannot fully participate in active brainstorming.\n\n• Human notes are subjective, prone to personal bias, and often incomplete.\n\n• Inconsistent note formats across teams prevent centralized searchability."
    for p in tf2.paragraphs:
        p.font.size = Pt(13)
        p.font.color.rgb = TEXT_WHITE

    c3 = add_card(slide2, 8.9, 1.6, 3.6, 5.2, "3. Task Accountability Void", ACCENT_YELLOW)
    tb3 = slide2.shapes.add_textbox(Inches(9.1), Inches(2.3), Inches(3.2), Inches(4.2))
    tf3 = tb3.text_frame
    tf3.word_wrap = True
    tf3.paragraphs[0].text = "• >40% of assigned action items in meetings fall through the cracks.\n\n• Verbal task assignments lack clear deadline, ownership, and priority definitions.\n\n• No built-in verification mechanism to review and confirm tasks before delegation."
    for p in tf3.paragraphs:
        p.font.size = Pt(13)
        p.font.color.rgb = TEXT_WHITE

    # ==================== SLIDE 3: Expected Outcome / Proposed Solution ====================
    slide3 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(slide3)
    add_header(slide3, "Expected Outcome & Proposed Solution: MeetingLens")

    # 2 Big Cards
    add_card(slide3, 0.8, 1.6, 5.65, 5.2, "Core Proposed Solution", ACCENT_BLUE)
    tb = slide3.shapes.add_textbox(Inches(1.05), Inches(2.3), Inches(5.15), Inches(4.3))
    tf = tb.text_frame
    tf.word_wrap = True
    items_sol = [
        ("Multi-Modal Meeting Capture: ", "Record live audio with real-time Speech-to-Text or upload existing audio, video, and text logs."),
        ("Multi-Tier AI Summaries: ", "Generate concise Executive Summaries, detailed chronological breakdowns, and key decision logs."),
        ("Automated Task Extraction: ", "NLP engine detects tasks, assigns owners, identifies deadlines, and tags urgency levels automatically.")
    ]
    for i, (head, desc) in enumerate(items_sol):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        run1 = p.add_run()
        run1.text = head
        run1.font.bold = True
        run1.font.color.rgb = ACCENT_BLUE
        run2 = p.add_run()
        run2.text = desc + "\n\n"
        run2.font.color.rgb = TEXT_WHITE
        p.font.size = Pt(13)

    add_card(slide3, 6.85, 1.6, 5.65, 5.2, "Key Measurable Deliverables", ACCENT_GREEN)
    tb_r = slide3.shapes.add_textbox(Inches(7.1), Inches(2.3), Inches(5.15), Inches(4.3))
    tf_r = tb_r.text_frame
    tf_r.word_wrap = True
    items_deliv = [
        ("Human-in-the-Loop Task Approval: ", "Interactive verification modal allowing managers to edit, confirm, or reassign AI tasks before saving."),
        ("Meeting Health & Quality Scoring: ", "Objective metrics evaluating meeting efficiency, structure, and outcome clarity (0-100%)."),
        ("Centralized Knowledge Archive: ", "Instant searchable repository with downloadable reports (PDF, Markdown, JSON).")
    ]
    for i, (head, desc) in enumerate(items_deliv):
        p = tf_r.paragraphs[0] if i == 0 else tf_r.add_paragraph()
        run1 = p.add_run()
        run1.text = head
        run1.font.bold = True
        run1.font.color.rgb = ACCENT_GREEN
        run2 = p.add_run()
        run2.text = desc + "\n\n"
        run2.font.color.rgb = TEXT_WHITE
        p.font.size = Pt(13)

    # ==================== SLIDE 4: Workflow Diagram ====================
    slide4 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(slide4)
    add_header(slide4, "End-to-End Workflow Diagram")

    # Flow Step Cards horizontally
    steps = [
        ("Step 1", "Audio Ingestion", "Live Voice Capture or Audio / Video / Text Upload", ACCENT_BLUE),
        ("Step 2", "Speech-to-Text", "Real-time client transcription & text preprocessing", ACCENT_PURPLE),
        ("Step 3", "AI Analysis Core", "LLM extracts summaries, action items & quality score", ACCENT_YELLOW),
        ("Step 4", "Task Approval", "Human-in-the-loop review, edit & owner assignment", ACCENT_GREEN),
        ("Step 5", "Persistence & Sync", "Save to MySQL DB, dispatch alerts & export reports", ACCENT_BLUE)
    ]

    for i, (snum, stitle, sdesc, col) in enumerate(steps):
        left_pos = 0.8 + (i * 2.4)
        add_card(slide4, left_pos, 1.7, 2.2, 3.2, snum, col)
        tb_s = slide4.shapes.add_textbox(Inches(left_pos + 0.15), Inches(2.4), Inches(1.9), Inches(2.3))
        tf_s = tb_s.text_frame
        tf_s.word_wrap = True
        p_t = tf_s.paragraphs[0]
        p_t.text = stitle
        p_t.font.bold = True
        p_t.font.size = Pt(14)
        p_t.font.color.rgb = TEXT_WHITE
        p_t.space_after = Pt(8)

        p_d = tf_s.add_paragraph()
        p_d.text = sdesc
        p_d.font.size = Pt(11)
        p_d.font.color.rgb = TEXT_MUTED

    # Bottom summary bar
    add_card(slide4, 0.8, 5.2, 11.7, 1.6, "Workflow Data Flow Highlights", ACCENT_GREEN)
    tb_b = slide4.shapes.add_textbox(Inches(1.05), Inches(5.8), Inches(11.2), Inches(0.9))
    tf_b = tb_b.text_frame
    tf_b.word_wrap = True
    p_b = tf_b.paragraphs[0]
    p_b.text = "Microphone Stream / File -> Speech Engine -> Clean Transcript -> Gemini / LLM Prompt -> Structured JSON -> Task Approval Modal -> MySQL Database -> Action Dashboard & Export Hub"
    p_b.font.size = Pt(13)
    p_b.font.bold = True
    p_b.font.color.rgb = TEXT_WHITE

    # ==================== SLIDE 5: System Architecture Diagram ====================
    slide5 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(slide5)
    add_header(slide5, "System Architecture Diagram")

    # 4 Layer Architecture Cards
    layers = [
        ("1. Client Layer (React SPA)", [
            "• Live Voice Meeting Room (Web Speech API)",
            "• Meeting Details & Dynamic Transcripts",
            "• Task Approval & Delegation Modal",
            "• Analytics & Executive Reports Dashboard"
        ], ACCENT_BLUE),
        ("2. API & Gateway Layer (PHP REST)", [
            "• JWT Authentication & Session Guard",
            "• /api/meetings - CRUD & History Engine",
            "• /api/analyze - AI Prompt Orchestration",
            "• /api/action-items - Task State & Delegation"
        ], ACCENT_PURPLE),
        ("3. Intelligence Layer (AI / LLM)", [
            "• Google Gemini / LLM NLP Core",
            "• Structured JSON Schema Extraction",
            "• Context Cleaning & Repair Engine",
            "• Meeting Quality & Sentiment Scoring"
        ], ACCENT_YELLOW),
        ("4. Data Persistence (MySQL)", [
            "• users (Accounts, Credentials, Roles)",
            "• meetings (Transcripts, Summaries, Scores)",
            "• action_items (Tasks, Assignees, Deadlines)",
            "• Relational Foreign Key Integrity (InnoDB)"
        ], ACCENT_GREEN),
    ]

    for i, (ltitle, lpoints, lcol) in enumerate(layers):
        left_pos = 0.8 + (i * 2.98)
        add_card(slide5, left_pos, 1.7, 2.78, 5.1, ltitle, lcol)
        tb_l = slide5.shapes.add_textbox(Inches(left_pos + 0.15), Inches(2.4), Inches(2.48), Inches(4.2))
        tf_l = tb_l.text_frame
        tf_l.word_wrap = True
        tf_l.paragraphs[0].text = "\n\n".join(lpoints)
        for p in tf_l.paragraphs:
            p.font.size = Pt(12)
            p.font.color.rgb = TEXT_WHITE

    # ==================== SLIDE 6: Technologies & Tools ====================
    slide6 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(slide6)
    add_header(slide6, "Technologies & Tools Planned / Implemented")

    add_card(slide6, 0.8, 1.6, 11.7, 5.2, "Technology Stack Breakdown", ACCENT_BLUE)

    table_shape = slide6.shapes.add_table(6, 3, Inches(1.05), Inches(2.2), Inches(11.2), Inches(4.3))
    table = table_shape.table
    table.columns[0].width = Inches(2.2)
    table.columns[1].width = Inches(3.6)
    table.columns[2].width = Inches(5.4)

    headers = ["Layer", "Technology / Tool", "Justification / Role"]
    for col_idx, h in enumerate(headers):
        cell = table.cell(0, col_idx)
        cell.text = h
        cell.fill.solid()
        cell.fill.fore_color.rgb = CARD_BORDER
        for p in cell.text_frame.paragraphs:
            p.font.bold = True
            p.font.size = Pt(13)
            p.font.color.rgb = ACCENT_BLUE

    rows_data = [
        ("Frontend UI", "React.js (Vite), Tailwind / Vanilla CSS", "High-speed rendering, modular reactive components & responsive design"),
        ("Audio / STT", "Web Speech API, MediaRecorder API", "Zero-latency in-browser real-time speech capture & audio processing"),
        ("Backend Server", "PHP 8.x (RESTful API), Apache / XAMPP", "Lightweight, robust API routing, JWT validation & prompt sanitization"),
        ("Database", "MySQL (InnoDB Relational Schema)", "ACID-compliant storage for users, transcripts, summaries & action items"),
        ("AI / NLP Core", "Google Gemini API / Multi-Model LLM", "Zero-shot JSON task extraction, executive summaries & quality scoring")
    ]

    for row_idx, data in enumerate(rows_data, start=1):
        for col_idx, text in enumerate(data):
            cell = table.cell(row_idx, col_idx)
            cell.text = text
            cell.fill.solid()
            cell.fill.fore_color.rgb = CARD_BG
            for p in cell.text_frame.paragraphs:
                p.font.size = Pt(11)
                p.font.color.rgb = TEXT_WHITE

    # ==================== SLIDE 7: Pseudocode & Algorithm ====================
    slide7 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(slide7)
    add_header(slide7, "Pseudocode: Meeting Intelligence Pipeline (MIP)")

    add_card(slide7, 0.8, 1.6, 11.7, 5.2, "Algorithm Execution Flow", ACCENT_PURPLE)

    tb_code = slide7.shapes.add_textbox(Inches(1.05), Inches(2.2), Inches(11.2), Inches(4.4))
    tf_code = tb_code.text_frame
    tf_code.word_wrap = True

    pseudo_code = (
        "Algorithm: MeetingIntelligencePipeline(InputSource, CurrentUser)\n"
        "1. IF InputSource is LiveAudio THEN Transcript = WebSpeechTranscribe(InputSource)\n"
        "   ELSE Transcript = SanitizeAndExtractText(InputSource)\n"
        "2. CleanText = RemoveNoiseAndFillerWords(Transcript)\n"
        "3. PromptPayload = BuildStructuredPrompt(Role='Executive PM', Transcript=CleanText, Schema='JSON')\n"
        "4. AI_Response = InvokeLLM_API(PromptPayload)\n"
        "5. ParsedData = ValidateAndParseJSON(AI_Response)\n"
        "6. DB_Transaction_Begin():\n"
        "     MeetingID = InsertMeeting(user_id=CurrentUser.id, title=ParsedData.title, summary=ParsedData.summary,\n"
        "                               executive_summary=ParsedData.executive_summary, quality_score=ParsedData.quality_score)\n"
        "     FOR EACH task IN ParsedData.action_items:\n"
        "         InsertActionItem(meeting_id=MeetingID, description=task.desc, assignee=task.owner, deadline=task.due)\n"
        "   DB_Transaction_Commit()\n"
        "7. Trigger TaskApprovalModal(MeetingID, ActionItems) for Human Verification & Editing\n"
        "8. Return Structured Meeting Dashboard View"
    )

    tf_code.paragraphs[0].text = pseudo_code
    for p in tf_code.paragraphs:
        p.font.name = "Consolas"
        p.font.size = Pt(12)
        p.font.color.rgb = ACCENT_GREEN

    # ==================== SLIDE 8: Assumptions & Challenges ====================
    slide8 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(slide8)
    add_header(slide8, "Assumptions, Technical Challenges & Mitigations")

    add_card(slide8, 0.8, 1.6, 5.65, 5.2, "Assumptions", ACCENT_BLUE)
    tb_as = slide8.shapes.add_textbox(Inches(1.05), Inches(2.3), Inches(5.15), Inches(4.3))
    tf_as = tb_as.text_frame
    tf_as.word_wrap = True
    assumptions = [
        ("Hardware & Network: ", "Users have an active microphone input and internet connectivity for LLM API transactions."),
        ("Participant Identification: ", "Speakers state names during discussion or context clues allow AI attribution."),
        ("Language Baseline: ", "Primary input language is English, with support for standard business terminology.")
    ]
    for i, (h, d) in enumerate(assumptions):
        p = tf_as.paragraphs[0] if i == 0 else tf_as.add_paragraph()
        r1 = p.add_run(); r1.text = h; r1.font.bold = True; r1.font.color.rgb = ACCENT_BLUE
        r2 = p.add_run(); r2.text = d + "\n\n"; r2.font.color.rgb = TEXT_WHITE
        p.font.size = Pt(13)

    add_card(slide8, 6.85, 1.6, 5.65, 5.2, "Challenges & Mitigations", ACCENT_YELLOW)
    tb_ch = slide8.shapes.add_textbox(Inches(7.1), Inches(2.3), Inches(5.15), Inches(4.3))
    tf_ch = tb_ch.text_frame
    tf_ch.word_wrap = True
    challenges = [
        ("LLM Hallucinations: ", "Mitigated via strict JSON schema enforcement and regex JSON sanitizers."),
        ("Ambient Noise & Broken Transcripts: ", "Mitigated via dual-phase text cleaning before passing to the analysis engine."),
        ("Ambiguous Deadlines & Owners: ", "Mitigated by human-in-the-loop Task Approval Modal before task finalization.")
    ]
    for i, (h, d) in enumerate(challenges):
        p = tf_ch.paragraphs[0] if i == 0 else tf_ch.add_paragraph()
        r1 = p.add_run(); r1.text = h; r1.font.bold = True; r1.font.color.rgb = ACCENT_YELLOW
        r2 = p.add_run(); r2.text = d + "\n\n"; r2.font.color.rgb = TEXT_WHITE
        p.font.size = Pt(13)

    # ==================== SLIDE 9: Future Advancements ====================
    slide9 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(slide9)
    add_header(slide9, "Future Advancements & Product Roadmap")

    cards_fut = [
        ("1. Speaker Diarization", "Integrate PyAnnote / WhisperX to automatically identify and isolate individual speakers with exact audio timestamps.", ACCENT_BLUE),
        ("2. PM Tool Integrations", "Direct webhook syncing of approved action items to Jira, Asana, Trello, Notion, and Google Calendar.", ACCENT_PURPLE),
        ("3. Meeting Bot Integrations", "Autonomous meeting bot that joins Zoom, Google Meet, and MS Teams calls to record and analyze automatically.", ACCENT_GREEN),
        ("4. Conversational RAG Archive", "Chat with historical meetings: Ask natural language questions across months of meeting transcripts.", ACCENT_YELLOW)
    ]

    for i, (ftitle, fdesc, fcol) in enumerate(cards_fut):
        row = i // 2
        col = i % 2
        left_pos = 0.8 + (col * 5.95)
        top_pos = 1.6 + (row * 2.65)
        add_card(slide9, left_pos, top_pos, 5.75, 2.45, ftitle, fcol)
        tb_f = slide9.shapes.add_textbox(Inches(left_pos + 0.2), Inches(top_pos + 0.65), Inches(5.35), Inches(1.6))
        tf_f = tb_f.text_frame
        tf_f.word_wrap = True
        p_f = tf_f.paragraphs[0]
        p_f.text = fdesc
        p_f.font.size = Pt(13)
        p_f.font.color.rgb = TEXT_WHITE

    # ==================== SLIDE 10: Conclusion & Q&A ====================
    slide10 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(slide10)

    add_card(slide10, 1.2, 1.2, 10.933, 5.1)

    tb_end = slide10.shapes.add_textbox(Inches(1.8), Inches(1.8), Inches(9.7), Inches(3.8))
    tf_end = tb_end.text_frame
    tf_end.word_wrap = True

    pe0 = tf_end.paragraphs[0]
    pe0.text = "CONCLUSION & SUMMARY"
    pe0.font.size = Pt(14)
    pe0.font.bold = True
    pe0.font.color.rgb = ACCENT_GREEN
    pe0.space_after = Pt(14)

    pe1 = tf_end.add_paragraph()
    pe1.text = "MeetingLens: Execution Without Friction"
    pe1.font.size = Pt(38)
    pe1.font.bold = True
    pe1.font.color.rgb = TEXT_WHITE
    pe1.space_after = Pt(14)

    pe2 = tf_end.add_paragraph()
    pe2.text = "• Eliminates post-meeting documentation fatigue through automated intelligence.\n• Enforces team accountability with human-in-the-loop task approval.\n• Provides a single source of truth for organization-wide meeting decisions."
    pe2.font.size = Pt(15)
    pe2.font.color.rgb = TEXT_MUTED
    pe2.space_after = Pt(26)

    pe3 = tf_end.add_paragraph()
    pe3.text = "Thank You! Questions & Discussion Welcome."
    pe3.font.size = Pt(20)
    pe3.font.bold = True
    pe3.font.color.rgb = ACCENT_BLUE

    # Save presentation
    output_path = os.path.abspath("MeetingLens_Presentation.pptx")
    prs.save(output_path)
    print(f"Presentation generated successfully at: {output_path}")

if __name__ == "__main__":
    create_presentation()

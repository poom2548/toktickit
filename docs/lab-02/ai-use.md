# AI Use Documentation

**LLM Used**: Gemini 3.1 Pro (High), Claude sonnet 4.6

## Key Prompts Used

| No. | Feature / Task | Prompt Snippet / Purpose | AI Contribution |
|-----|----------------|--------------------------|-----------------|
| 1   | Setup          | Initialize Playwright at root | ช่วยตั้งค่าสภาพแวดล้อมสำหรับการทดสอบ |
| 2   | E2E Testing    | Write requester ticket flow test |สร้าง Locator ที่เสถียรและวางโครงสร้างการทดสอบ |
| 3   | E2E Testing    | Automate responsive screenshots | เขียนสคริปต์ตั้งค่าขนาดหน้าจอ (Viewport) และการนำทางเว็บไซต์ (Navigation) |
| 4   | Correct User Journey & State Assertions  | The success screen displays 'Ticket Created!' rather than 'Success'... change the locator from navigating via 'My Tickets' to using the 'Back to Dashboard' button. | ตรวจจับข้อความ Assertion ที่ผิดพลาด และจัดระเบียบ Flow การนำทางใหม่ |
| 5   | Fix Navigation Locators | The application's navigation menu items are rendered as button elements, not links (a). Please replace getByRole('link') with getByRole('button') | วิเคราะห์ Snapshot พบ UI ใช้ button จึงแก้ Locator และชื่อปุ่มให้ตรง |
| 6   | Resolve Strict Mode Violations | Chain .first() to the locator to explicitly target the top navigation button | เสนอวิธีใช้ .first() เลี่ยงบั๊ก Locator กว้างไป และแยกสเต็ปอัปโหลดไฟล์ |

## My Reflection

**สิ่งที่ได้เรียนรู้และสะท้อนคิดจากการใช้ AI:**
ในlabนี้ AI เป็นผู้ช่วยที่ดีมาก โดยเฉพาะในขั้นตอนการแก้บั๊กการทดสอบ End-to-End (E2E) ด้วย Playwright ที่มีความซับซ้อน 

**AI ช่วยเหลืออย่างไร?**
AI ช่วยลดเวลาในการหาสาเหตุของบั๊กได้มาก ทุกครั้งที่เจอ Error โดยเฉพาะตอนที่ใช้ playwright test ผมเจอ error ซ้อนกันหลายครั้งผมเลยใช้ AI ช่วยแก้ไปทีละขั้น

**อุปสรรคที่พบคืออะไร?**
บางครั้ง AI จะเสนอโค้ดที่เป็นรูปแบบมาตรฐานทั่วไป ซึ่งไม่ตรงกับหน้า UI จริงของผม เช่น AI คิดว่าหน้าเว็บใช้ Dropdown แต่จริงๆผมใช้ปุ่ม หรือใส่ชื่อปุ่มผิดจาก Remove เป็น Delete ทำให้เรียนรู้ว่าเราไม่สามารถก๊อปปี้โค้ดมาวางได้ทันที แต่ต้องป้อนข้อมูลให้ AI อย่างละเอียด เช่น การแนบ Error Log ไปด้วยAIจะได้เจาะจงได้ถูกจุด รวมถึงต้องคอยตรวจสอบโค้ดที่ AI ให้มาว่าตรงกับหน้าเว็บจริงหรือไม่ ซึ่งกระบวนการนี้ช่วยฝึกทักษะการเขียน Prompt ให้แม่นยำขึ้นได้มาก
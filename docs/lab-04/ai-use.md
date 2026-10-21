# เอกสารการใช้งาน AI (AI Use Documentation) - Lab 4

เอกสารนี้รวบรวมรายละเอียดการใช้งานโมเดลภาษาขนาดใหญ่ (LLMs) และตัวแทนเขียนโค้ดอัตโนมัติ (Coding Agent) สำหรับการพัฒนาใน CPE 334 Lab 4 เพื่อความโปร่งใส ตรวจสอบย้อนกลับได้ และสะท้อนคิดเกี่ยวกับกระบวนการทำงานร่วมกับ AI

---

## 1. LLM ที่ใช้ (LLMs Used)

| ชื่อโมเดล (Model Name) | ผู้ให้บริการ / เวอร์ชัน (Vendor / Version) | บทบาทหน้าที่ในโปรเจกต์ (Role & Tasks) | ส่วนงานที่นำไปใช้ (Where Used) |
| :--- | :--- | :--- | :--- |
| <<STUDENT TO FILL: Model 1>> | <<STUDENT TO FILL: Vendor 1>> | <<STUDENT TO FILL: Role 1>> | <<STUDENT TO FILL: Where used 1>> |
| <<STUDENT TO FILL: Model 2>> | <<STUDENT TO FILL: Vendor 2>> | <<STUDENT TO FILL: Role 2>> | <<STUDENT TO FILL: Where used 2>> |

*หมายเหตุข้อเท็จจริงของคลังข้อมูล:* งานพัฒนาและการจัดทำเอกสารในโปรเจกต์นี้ดำเนินการผ่าน Antigravity Coding Agent ภายใต้กฎข้อบังคับ Git ของคลังข้อมูลที่เข้มงวด โดย Agent ได้รับอนุญาตให้ทำงานเฉพาะการแก้ไขและ commit บนกิ่งงานในเครื่องเท่านั้น ไม่มีการ push หรือ merge อัตโนมัติ

---

## 2. Prompt สำคัญ (Key Prompts, 6-10)

หัวข้อแนะนำเพื่อช่วยนำทางในการบันทึก Prompt (Suggested Topics):
- การสร้างข้อกำหนดความต้องการ (Specification Generation)
- การออกแบบ State Machine Transition Matrix
- แผนการทดสอบและการเขียนชุดทดสอบล่วงหน้า (Test-Driven Development)
- การออกแบบโครงสร้างฐานข้อมูลและการย้ายข้อมูล (Database Migration & Rollback Design)
- การออกแบบ API Contract และการจัดการข้อผิดพลาด (API Design & Error Envelope)
- การตรวจประเมิน UI, การเข้าถึง (WCAG AA Accessibility) และ Responsive Layout
- การค้นหาบั๊กและการจัดการสภาวะการแย่งชิงข้อมูล (Debugging & Concurrency Handling)
- การตรวจสอบความสอดคล้องและการเตรียมความพร้อมส่งมอบ (Final Consistency Audit & Release Prep)

### Prompt ที่ 1: <<STUDENT TO FILL: หัวข้อ/วัตถุประสงค์>>
> <<STUDENT TO PASTE: ข้อความ Prompt ที่ 1 (verbatim or lightly trimmed)>>

- **วัตถุประสงค์ (Purpose):** <<STUDENT TO FILL: วัตถุประสงค์ของ Prompt นี้>>
- **หลักฐานใน repository (Evidence):** <<STUDENT TO FILL: Commit hash / PR / ไฟล์ที่เกิดขึ้นจากการรัน เช่น Commit ab84cfa หรือ PR #69>>

### Prompt ที่ 2: <<STUDENT TO FILL: หัวข้อ/วัตถุประสงค์>>
> <<STUDENT TO PASTE: ข้อความ Prompt ที่ 2>>

- **วัตถุประสงค์ (Purpose):** <<STUDENT TO FILL: วัตถุประสงค์ของ Prompt นี้>>
- **หลักฐานใน repository (Evidence):** <<STUDENT TO FILL: Commit hash / PR / ไฟล์ที่เกิดขึ้น>>

### Prompt ที่ 3: <<STUDENT TO FILL: หัวข้อ/วัตถุประสงค์>>
> <<STUDENT TO PASTE: ข้อความ Prompt ที่ 3>>

- **วัตถุประสงค์ (Purpose):** <<STUDENT TO FILL: วัตถุประสงค์ของ Prompt นี้>>
- **หลักฐานใน repository (Evidence):** <<STUDENT TO FILL: Commit hash / PR / ไฟล์ที่เกิดขึ้น>>

### Prompt ที่ 4: <<STUDENT TO FILL: หัวข้อ/วัตถุประสงค์>>
> <<STUDENT TO PASTE: ข้อความ Prompt ที่ 4>>

- **วัตถุประสงค์ (Purpose):** <<STUDENT TO FILL: วัตถุประสงค์ของ Prompt นี้>>
- **หลักฐานใน repository (Evidence):** <<STUDENT TO FILL: Commit hash / PR / ไฟล์ที่เกิดขึ้น>>

### Prompt ที่ 5: <<STUDENT TO FILL: หัวข้อ/วัตถุประสงค์>>
> <<STUDENT TO PASTE: ข้อความ Prompt ที่ 5>>

- **วัตถุประสงค์ (Purpose):** <<STUDENT TO FILL: วัตถุประสงค์ของ Prompt นี้>>
- **หลักฐานใน repository (Evidence):** <<STUDENT TO FILL: Commit hash / PR / ไฟล์ที่เกิดขึ้น>>

### Prompt ที่ 6: <<STUDENT TO FILL: หัวข้อ/วัตถุประสงค์>>
> <<STUDENT TO PASTE: ข้อความ Prompt ที่ 6>>

- **วัตถุประสงค์ (Purpose):** <<STUDENT TO FILL: วัตถุประสงค์ของ Prompt นี้>>
- **หลักฐานใน repository (Evidence):** <<STUDENT TO FILL: Commit hash / PR / ไฟล์ที่เกิดขึ้น>>

*(สามารถเพิ่ม Prompt เพิ่มเติมได้ถึง 10 รายการตามความเหมาะสม)*

---

## 3. สิ่งที่ฉันตรวจสอบเอง (What I Verified Myself)

<<STUDENT TO WRITE: อธิบายรายการที่นักศึกษาตรวจสอบด้วยตนเอง เช่น การรันชุดทดสอบซ้ำด้วยมือ, การตรวจสอบหน้าเว็บ UI จริง, การตรวจโค้ด SQL Migration, หรือการทดสอบกรอกข้อมูลผ่านเบราว์เซอร์>>

---

## 4. สะท้อนความคิดเห็นส่วนตัว (My Reflection)

### 4.1 การใช้ Specification Agent
*แนวทางคำถามกระตุ้นความคิด (Guiding Questions):*
- Specification Agent มีส่วนช่วยให้การกำหนดขอบเขตและกฎทางธุรกิจ (Business Rules) รัดกุมขึ้นอย่างไร?
- Agent เคยสร้างข้อกำหนดที่คลุมเครือหรือผิดพลาดจากโจทย์เดิมหรือไม่ และคุณค้นพบและปรับแก้อย่างไร?
- การมีเอกสาร Specification ที่ชัดเจนล่วงหน้า ช่วยกระบวนการพัฒนาและทดสอบในขั้นตอนถัดไปอย่างไร?

<<STUDENT TO WRITE: บันทึกข้อคิดเห็นและประสบการณ์ส่วนตัวเกี่ยวกับการใช้งาน Specification Agent>>

### 4.2 การใช้ Coding Agent
*แนวทางคำถามกระตุ้นความคิด (Guiding Questions):*
- การเขียนชุดทดสอบล่วงหน้า (Test-Driven Development) ช่วยควบคุมไม่ให้ Coding Agent เขียนโค้ดออกนอกลู่นอกทางได้อย่างไร?
- จุดที่ Agent ทำงานได้มีประสิทธิภาพสูง (เช่น การทำ Mocking, การเขียน Boilerplate) และจุดที่ Agent มักพลาด (เช่น Race condition, CSS responsive, Strict Mode violations)?
- ข้อคิดเกี่ยวกับการเป็น Software Engineer เมื่อต้องทำงานร่วมกับ AI Coding Assistant?

<<STUDENT TO WRITE: บันทึกข้อคิดเห็นและประสบการณ์ส่วนตัวเกี่ยวกับการใช้งาน Coding Agent>>

---

## 5. ขอบเขตและกฎ Git ของ agent (Agent Scope and Git Rules)

ในระหว่างการพัฒนา Lab 4 ของคลังข้อมูลนี้ ตัวแทนเขียนโค้ด (Coding Agent) ได้รับการกำหนดบทบาทและข้อจำกัดการใช้งาน Git อย่างเคร่งครัด: Agent ได้รับอนุญาตเฉพาะการสร้างและแก้ไขไฟล์ในขอบเขตที่ได้รับมอบหมาย รวมถึงการสร้างคอมมิตในเครื่อง (`git add <explicit-path>` และ `git commit`) บน Local Feature Branch เท่านั้น โดยห้ามมิให้ Agent เรียกคำสั่ง `git push` หรือสั่งรวมสาขา (`git merge`) โดยเด็ดขาด การผลักดันโค้ดขึ้นสู่ GitHub Remote การเปิด Pull Request การตรวจทานโค้ด (Peer Review) และการอนุมัติรวมสาขาเข้าสู่ `lab4-staging` และ `main` ต้องกระทำโดยมนุษย์เสมอเพื่อความปลอดภัยและความถูกต้องของประวัติการพัฒนา

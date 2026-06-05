# Database Schema — PCSHS CR Sports Equipment Borrowing System

## ER Diagram

```
┌─────────────────┐       ┌──────────────────────┐       ┌──────────────────┐
│   auth.users    │       │       users           │       │equipment_categories│
│  (Supabase)     │──1:1──│                      │       │                  │
│  id (UUID)      │       │  id          UUID PK │       │  id     SERIAL PK│
│  email          │       │  full_name   TEXT    │       │  name   TEXT     │
│  ...            │       │  student_id  TEXT    │       │  slug   TEXT     │
└─────────────────┘       │  classroom   TEXT    │       │  icon   TEXT     │
                           │  role        ENUM   │       └──────┬───────────┘
                           │  is_active   BOOL   │              │ 1
                           └────────┬────────────┘              │
                                    │ 1                          │ N
                                    │                    ┌───────▼──────────┐
                                    │ N                  │    equipment     │
                           ┌────────▼────────────┐      │                  │
                           │  borrow_requests    │      │  id          UUID│
                           │                     │      │  name        TEXT│
                           │  id    UUID PK      │      │  category_id INT │
                           │  request_number TEXT│      │  total_qty   INT │
                           │  student_id  UUID──►│─users│  avail_qty   INT │
                           │  approved_by UUID──►│─users│  status      ENUM│
                           │  status      ENUM   │      │  max_borrow_days │
                           │  borrow_date DATE   │      └──────┬───────────┘
                           │  return_date DATE   │             │ 1
                           └────────┬────────────┘             │ N
                                    │ 1                ┌────────▼──────────┐
                                    │ N                │   borrow_items    │
                           ┌────────▼────────────┐    │                   │
                           │      returns        │    │  id          UUID │
                           │                     │    │  request_id  UUID►│
                           │  id    UUID PK      │    │  equipment_id UUID►
                           │  request_id  UUID──►│    │  quantity    INT  │
                           │  recorded_by UUID──►│    └───────────────────┘
                           │  actual_date DATE   │
                           │  condition   ENUM   │    ┌───────────────────┐
                           └────────┬────────────┘    │   damage_reports  │
                                    │ 1               │                   │
                                    │ N               │  id          UUID │
                           ┌────────▼────────────┐    │  equipment_id UUID►
                           │   damage_reports    │◄───│  return_id   UUID │
                           │  (from return)      │    │  reported_by UUID►│
                           └─────────────────────┘    │  condition   ENUM │
                                                       │  status      ENUM │
                           ┌─────────────────────┐    └───────────────────┘
                           │   notifications     │
                           │                     │    ┌────────────────────┐
                           │  id      UUID PK    │    │   Enum Types       │
                           │  user_id UUID──►    │    ├────────────────────┤
                           │  title   TEXT       │    │ user_role:         │
                           │  message TEXT       │    │   student          │
                           │  type    ENUM       │    │   teacher          │
                           │  is_read BOOL       │    │   admin            │
                           │  related_request UUID►   ├────────────────────┤
                           └─────────────────────┘    │ request_status:    │
                                                       │   pending          │
                                                       │   approved         │
                                                       │   borrowed         │
                                                       │   returned         │
                                                       │   overdue          │
                                                       │   rejected         │
                                                       │   damaged          │
                                                       │   lost             │
                                                       └────────────────────┘
```

## ตารางและ Field สำคัญ

### 1. `users`
| Field        | Type         | Key   | คำอธิบาย                        |
|-------------|--------------|-------|----------------------------------|
| id           | UUID         | PK/FK | อ้างอิง auth.users.id            |
| full_name    | TEXT         |       | ชื่อ-นามสกุล                    |
| student_id   | TEXT         | UQ    | รหัสนักเรียน (NULL ถ้าเป็นครู)  |
| classroom    | TEXT         |       | ชั้น/ห้อง เช่น ม.4/1             |
| role         | user_role    |       | student / teacher / admin         |
| is_active    | BOOLEAN      |       | สถานะการใช้งาน                  |

### 2. `equipment_categories`
| Field       | Type    | Key | คำอธิบาย                   |
|------------|---------|-----|----------------------------|
| id          | SERIAL  | PK  | Auto-increment              |
| name        | TEXT    | UQ  | ฟุตบอล, บาสเกตบอล ฯลฯ     |
| slug        | TEXT    | UQ  | football, basketball        |
| sort_order  | INT     |     | ลำดับการแสดงผล              |

### 3. `equipment`
| Field              | Type             | Key | คำอธิบาย                              |
|-------------------|-----------------|-----|----------------------------------------|
| id                 | UUID             | PK  |                                        |
| name               | TEXT             |     | ชื่ออุปกรณ์                           |
| category_id        | INT              | FK  | → equipment_categories.id             |
| total_quantity     | INT              |     | จำนวนทั้งหมดในคลัง                    |
| available_quantity | INT              |     | จำนวนที่ว่าง (อัปเดตโดย trigger)      |
| status             | equipment_status |     | available / borrowed / damaged ฯลฯ    |
| max_borrow_days    | INT              |     | ยืมได้สูงสุดกี่วัน                     |
| max_borrow_quantity| INT              |     | ยืมได้สูงสุดกี่ชิ้นต่อครั้ง            |

### 4. `borrow_requests`
| Field                | Type           | Key  | คำอธิบาย                       |
|---------------------|---------------|------|---------------------------------|
| id                   | UUID           | PK   |                                 |
| request_number       | TEXT           | UQ   | REQ-20260605-0001               |
| student_id           | UUID           | FK   | → users.id                      |
| approved_by          | UUID           | FK   | → users.id (ครูที่อนุมัติ)      |
| status               | request_status |      | pending → approved → borrowed   |
| borrow_date          | DATE           |      | วันที่ยืม                       |
| expected_return_date | DATE           |      | วันที่คาดว่าจะคืน               |
| actual_return_date   | DATE           |      | วันที่คืนจริง (หลังคืน)         |
| purpose              | TEXT           |      | วัตถุประสงค์                    |

### 5. `borrow_items`
| Field        | Type | Key | คำอธิบาย                          |
|-------------|------|-----|-----------------------------------|
| id           | UUID | PK  |                                   |
| request_id   | UUID | FK  | → borrow_requests.id              |
| equipment_id | UUID | FK  | → equipment.id                    |
| quantity     | INT  |     | จำนวนที่ขอยืม                     |
| UNIQUE       |      |     | (request_id, equipment_id)        |

### 6. `returns`
| Field              | Type           | Key | คำอธิบาย                      |
|-------------------|---------------|-----|-------------------------------|
| id                 | UUID           | PK  |                               |
| request_id         | UUID           | FK  | → borrow_requests.id          |
| recorded_by        | UUID           | FK  | → users.id (ครูที่บันทึก)    |
| actual_return_date | DATE           |     | วันที่คืนจริง                 |
| quantity_returned  | INT            |     | จำนวนที่คืน                   |
| condition          | condition_type |     | good / fair / damaged / lost  |

### 7. `damage_reports`
| Field             | Type          | Key | คำอธิบาย                          |
|------------------|--------------|-----|-----------------------------------|
| id                | UUID          | PK  |                                   |
| equipment_id      | UUID          | FK  | → equipment.id                    |
| return_id         | UUID          | FK  | → returns.id (NULL ถ้าพบก่อนคืน) |
| reported_by       | UUID          | FK  | → users.id                        |
| condition         | condition_type|     | damaged / lost                    |
| quantity_affected | INT           |     | จำนวนที่ชำรุด/สูญหาย             |
| status            | damage_status |     | reported → repaired / written_off |

### 8. `notifications`
| Field              | Type              | Key | คำอธิบาย                      |
|-------------------|-----------------|-----|-------------------------------|
| id                 | UUID              | PK  |                               |
| user_id            | UUID              | FK  | → users.id                    |
| title              | TEXT              |     | หัวข้อ                        |
| message            | TEXT              |     | เนื้อหา                       |
| type               | notification_type |     | ประเภทการแจ้งเตือน            |
| is_read            | BOOLEAN           |     | อ่านแล้วหรือยัง               |
| related_request_id | UUID              | FK  | → borrow_requests.id (ถ้ามี)  |

## วิธี Deploy ขึ้น Supabase

```bash
# 1. ติดตั้ง Supabase CLI
npm install -g supabase

# 2. Login และ link project
supabase login
supabase link --project-ref <your-project-ref>

# 3. Run migration (แนะนำวิธีนี้)
supabase db push

# หรือ run SQL ตรงใน Supabase Dashboard > SQL Editor ตามลำดับ:
# 1. schema.sql
# 2. functions.sql
# 3. rls.sql
# 4. seed.sql
```

## Supabase Environment Variables (สำหรับ React App)

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Row Level Security Summary

| Table                | Student              | Teacher           | Admin      |
|---------------------|---------------------|------------------|------------|
| users                | Read own            | Read all          | Full       |
| equipment_categories | Read all            | Full              | Full       |
| equipment            | Read active         | Full              | Full       |
| borrow_requests      | Read/Insert own     | Read/Update all   | Full       |
| borrow_items         | Read own            | Full              | Full       |
| returns              | Read own            | Full              | Full       |
| damage_reports       | Read related        | Full              | Full       |
| notifications        | Read/Update own     | (system inserts)  | Full       |

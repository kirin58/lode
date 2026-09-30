<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api, ApiError } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'
import { useItemsStore } from '@/stores/items'
import { useHealthStore } from '@/stores/health'
import { useToastStore } from '@/stores/toast'
import type { ItemKind } from '@/types'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const store = useItemsStore()
const health = useHealthStore()
const toast = useToastStore()

const kind = ref<ItemKind>((route.query.kind as ItemKind) ?? 'found')
const title = ref('')
const description = ref('')
const category = ref<string>('')
const location = ref('')
const occurredAt = ref(new Date().toISOString().slice(0, 10))
const contact = ref('')
const reward = ref(0)
const file = ref<File | null>(null)
const preview = ref<string | null>(null)
const submitting = ref(false)
const error = ref('')

const titlePlaceholder = computed(() =>
  kind.value === 'found'
    ? 'เช่น AirPods Pro 2 สีขาว พร้อมเคสชาร์จ'
    : 'เช่น กระเป๋าผ้าใบใหญ่ สีดำ มีตัวลิง'
)

const hint = computed(() =>
  kind.value === 'found'
    ? { icon: '🫶', title: 'เจอแล้ว!', body: 'ยิ่งรายละเอียดคมชัด ยิ่งหาเจ้าของได้เร็ว' }
    : { icon: '🫥', title: 'ทำหาย', body: 'เขียนจุดสังเกตที่จำได้ เจ้าของเห็นแล้วจำได้ทันที' }
)

const rewardMarks = [0, 50, 100, 200, 500, 1000, 2000]

function pickFile(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (!f) return
  if (!/^image\//.test(f.type)) {
    toast.error('เลือกได้แค่รูปภาพ', 'ลองใหม่อีกครั้งนะ')
    return
  }
  if (f.size > 4 * 1024 * 1024) {
    toast.error('รูปใหญ่เกิน 4 MB', 'ย่อรูปก่อนอัปโหลดนะ')
    return
  }
  file.value = f
  preview.value = URL.createObjectURL(f)
}

function switchKind(next: ItemKind) {
  kind.value = next
  if (next === 'lost' && reward.value === 0) reward.value = 0
}

async function submit() {
  if (submitting.value) return // กัน double-submit (คลิกรัว ๆ แล้วสร้างประกาศซ้ำ)
  error.value = ''
  if (title.value.trim().length < 3) {
    error.value = 'ใส่ชื่อของอย่างน้อย 3 ตัวอักษรหน่อยนะ'
    return
  }
  submitting.value = true
  try {
    // โหมด s3 (Neon S3 — ใช้ได้ทั้ง local และ Vercel): ขอ presigned URL แล้ว PUT ไฟล์ตรง
    let imageUrl: string | null = null
    if (health.uploadMode === 's3' && file.value) {
      const presign = await api.post<{ uploadUrl: string; key: string; imageUrl: string }>(
        '/uploads/presign',
        { contentType: file.value.type, size: file.value.size }
      )
      const put = await fetch(presign.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.value.type },
        body: file.value,
      })
      if (!put.ok) throw new Error('อัปโหลดรูปไม่สำเร็จ ลองใหม่อีกครั้งนะ')
      imageUrl = presign.imageUrl
    }

    // โหมด local (Express ตอน dev): ส่ง multipart พร้อมรูปแนบไปเลย
    const isMultipart = health.uploadMode !== 's3'
    let res: { item: { id: string } }
    if (isMultipart) {
      const fd = new FormData()
      fd.append('kind', kind.value)
      fd.append('title', title.value.trim())
      fd.append('description', description.value.trim())
      fd.append('category_id', category.value)
      fd.append('location', location.value.trim())
      fd.append('occurred_at', occurredAt.value)
      fd.append('contact_line', contact.value.trim())
      fd.append('reward', String(reward.value))
      if (file.value) fd.append('image', file.value)
      res = await api.post<{ item: { id: string } }>('/items', fd)
    } else {
      res = await api.post<{ item: { id: string } }>('/items', {
        kind: kind.value,
        title: title.value.trim(),
        description: description.value.trim(),
        category_id: category.value || null,
        location: location.value.trim(),
        occurred_at: occurredAt.value,
        contact_line: contact.value.trim(),
        reward: reward.value,
        image_url: imageUrl,
      })
    }
    toast.party(
      kind.value === 'found' ? 'ลงประกาศเรียบร้อย! 🎉' : 'โพสต์หาของเรียบร้อย! 🙋',
      'ตอนนี้ทุกคนในมหาลักษณ์จะเห็นแล้วนะ',
    )
    await store.loadMeta()
    router.push(`/item/${res.item.id}`)
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'ลองใหม่อีกครั้งนะ'
    toast.error('บันทึกไม่สำเร็จ', error.value)
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  await auth.init()
  if (!store.categories.length) await store.loadMeta().catch(() => {})
  contact.value = auth.user?.email ?? ''
  await health.check()
})
</script>

<template>
  <div class="mx-auto max-w-5xl px-4 py-10 sm:px-6">
    <div class="mb-8 text-center">
      <p
        class="mb-3 inline-flex items-center gap-2 rounded-full bg-fill px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-1 ring-1 ring-line"
      >
        <span class="size-1.5 rounded-full bg-bubble-400 animate-pulse" />
        ลงประกาศฟรี
      </p>
      <h1 class="font-display text-3xl font-black sm:text-5xl">
        เล่าเรื่องของของคุณ <span class="text-gradient-hot">เลย</span> ✍️
      </h1>
      <p class="mt-2 text-sm text-muted-2">ใช้เวลาไม่ถึงนาที แล้วเพื่อนจะช่วยกันหาให้</p>
    </div>

    <!-- kind switch -->
    <div class="mx-auto mb-8 grid max-w-lg grid-cols-2 gap-3">
      <button
        v-for="k in [
          { id: 'found', label: 'เจอแล้ว', emoji: '🫶', desc: 'เก็บได้ มาส่งคืน' },
          { id: 'lost', label: 'ทำของหาย', emoji: '🫥', desc: 'มาขอคืน' },
        ]"
        :key="k.id"
        class="rounded-3xl p-4 text-left ring-1 transition duration-300 hover:-translate-y-1"
        :class="
          kind === k.id
            ? 'bg-gradient-to-br from-bubble-500/25 to-night-500/25 ring-line shadow-glow'
            : 'glass ring-line hover:bg-fill-2'
        "
        @click="switchKind(k.id as ItemKind)"
      >
        <span class="text-2xl">{{ k.emoji }}</span>
        <p class="mt-1.5 font-display text-base font-extrabold">{{ k.label }}</p>
        <p class="text-[11px] text-muted-2">{{ k.desc }}</p>
      </button>
    </div>

    <form
      class="grid gap-5 lg:grid-cols-[1fr_0.85fr]"
      @submit.prevent="submit"
    >
      <!-- left: fields -->
      <div class="space-y-5 rounded-[2rem] glass p-6">
        <div
          class="flex items-start gap-3 rounded-2xl p-4 ring-1"
          :class="kind === 'found' ? 'bg-mint-pop/8 ring-mint-pop/20' : 'bg-bubble-500/8 ring-bubble-500/20'"
        >
          <span class="text-2xl">{{ hint.icon }}</span>
          <div>
            <p class="font-display text-sm font-extrabold">{{ hint.title }}</p>
            <p class="text-xs text-muted-2">{{ hint.body }}</p>
          </div>
        </div>

        <label class="block">
          <span class="mb-2 block text-xs font-bold text-muted-1">
            ชื่อของ <span class="text-rose-400">*</span>
          </span>
          <input
            v-model="title"
            type="text"
            :placeholder="titlePlaceholder"
            maxlength="90"
            class="w-full rounded-2xl bg-fill px-4 py-3.5 text-sm outline-none ring-1 ring-line transition placeholder:text-muted-3 focus:ring-2 focus:ring-bubble-400/60"
          />
        </label>

        <label class="block">
          <span class="mb-2 block text-xs font-bold text-muted-1">รายละเอียดเพิ่มเติม</span>
          <textarea
            v-model="description"
            rows="4"
            maxlength="1200"
            placeholder="สี ตรา รอยขีด จุดที่เจอ หรืออะไรก็ได้ที่ช่วยให้จำได้ 💭"
            class="w-full resize-none rounded-2xl bg-fill px-4 py-3.5 text-sm leading-relaxed outline-none ring-1 ring-line transition placeholder:text-muted-3 focus:ring-2 focus:ring-bubble-400/60"
          />
          <span class="mt-1 block text-right text-[11px] text-muted-3">
            {{ description.length }}/1200
          </span>
        </label>

        <div>
          <span class="mb-2 block text-xs font-bold text-muted-1">หมวดหมู่</span>
          <div class="grid grid-cols-3 gap-2 sm:grid-cols-5">
            <button
              v-for="c in store.categories"
              :key="c.id"
              type="button"
              class="flex flex-col items-center gap-1 rounded-2xl px-2 py-3 text-[10px] font-bold ring-1 transition hover:-translate-y-0.5"
              :class="
                category === c.id
                  ? 'bg-title text-paper ring-line'
                  : 'bg-fill text-muted-1 ring-line hover:bg-fill-2'
              "
              @click="category = category === c.id ? '' : c.id"
            >
              <span class="text-lg">{{ c.emoji }}</span>
              <span class="leading-tight">{{ c.label }}</span>
            </button>
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block">
            <span class="mb-2 block text-xs font-bold text-muted-1">สถานที่</span>
            <input
              v-model="location"
              type="text"
              maxlength="120"
              placeholder="เช่น อาคาร A ชั้น 4 ห้อง A402"
              class="w-full rounded-2xl bg-fill px-4 py-3.5 text-sm outline-none ring-1 ring-line transition placeholder:text-muted-3 focus:ring-2 focus:ring-bubble-400/60"
            />
          </label>
          <label class="block">
            <span class="mb-2 block text-xs font-bold text-muted-1">วันที่</span>
            <input
              v-model="occurredAt"
              type="date"
              class="w-full rounded-2xl bg-fill px-4 py-3.5 text-sm text-night-100 outline-none ring-1 ring-line transition focus:ring-2 focus:ring-bubble-400/60"
            />
          </label>
        </div>

        <label class="block">
          <span class="mb-2 block text-xs font-bold text-muted-1">ช่องทางติดต่อ (ไลน์ / เบอร์)</span>
          <input
            v-model="contact"
            type="text"
            maxlength="120"
            placeholder="@lineid หรือ 08x-xxx-xxxx"
            class="w-full rounded-2xl bg-fill px-4 py-3.5 text-sm outline-none ring-1 ring-line transition placeholder:text-muted-3 focus:ring-2 focus:ring-bubble-400/60"
          />
        </label>

        <div>
          <span class="mb-2 block text-xs font-bold text-muted-1">
            ให้รางวัลไหม? (ไม่บังคับ)
          </span>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="r in rewardMarks"
              :key="r"
              type="button"
              class="rounded-2xl px-3.5 py-2 text-xs font-extrabold ring-1 transition hover:-translate-y-0.5"
              :class="
                reward === r
                  ? 'bg-lime-pop text-paper ring-lime-pop'
                  : 'bg-fill text-muted-1 ring-line hover:bg-fill-2'
              "
              @click="reward = r"
            >
              {{ r === 0 ? 'ไม่ให้' : `฿${r}` }}
            </button>
          </div>
          <p class="mt-2 text-[11px] text-muted-3">
            ประกาศที่มีรางวัล มักได้ของคืนเร็วกว่า ~3 เท่า 💎
          </p>
        </div>
      </div>

      <!-- right: image + submit -->
      <div class="space-y-5">
        <!-- serverless (Vercel) เขียนไฟล์ไม่ได้ → ซ่อนส่วนอัปโหลดรูป -->
        <div v-if="!health.uploads" class="rounded-[2rem] glass p-6">
          <span class="mb-3 block text-xs font-bold text-muted-1">รูปของ</span>
          <div class="rounded-3xl border-2 border-dashed border-line p-6 text-center">
            <p class="text-2xl">🖼️</p>
            <p class="mt-2 text-xs leading-relaxed text-muted-2">
              เวอร์ชันนี้ (Vercel serverless) ยังไม่รองรับการอัปโหลดรูป
              <br />แต่ยังโพสต์ประกาศพร้อมรายละเอียดได้ตามปกติครับ
            </p>
          </div>
        </div>

        <div v-else class="rounded-[2rem] glass p-6">
          <span class="mb-3 block text-xs font-bold text-muted-1">รูปของ (ถ้ามี)</span>
          <div
            class="relative aspect-square overflow-hidden rounded-3xl ring-1"
            :class="preview ? 'ring-line' : 'border-2 border-dashed border-white/12'"
          >
            <div v-if="preview" class="h-full w-full">
              <img :src="preview" alt="ตัวอย่างรูป" class="h-full w-full object-cover" />
            </div>
            <label
              v-else
              class="absolute inset-0 grid cursor-pointer place-items-center text-center transition hover:bg-fill"
            >
              <div>
                <div class="text-4xl">📸</div>
                <p class="mt-2 text-sm font-bold">กดเพื่ออัปโหลด</p>
                <p class="text-[11px] text-muted-3">รองรับ JPG/PNG ไม่เกิน 4 MB</p>
              </div>
            </label>
            <input
              type="file"
              accept="image/*"
              class="absolute inset-0 cursor-pointer opacity-0"
              @change="pickFile"
            />
            <button
              v-if="preview"
              type="button"
              class="absolute right-3 top-3 grid size-9 place-items-center rounded-2xl bg-veil text-sm ring-1 ring-line backdrop-blur transition hover:bg-ink"
              @click="file = null; preview = null"
            >
              ✕
            </button>
          </div>
          <p class="mt-2 text-[11px] leading-relaxed text-muted-3">
            💡 ประกาศที่มีรูป มักได้รับคำขอเข้ามามากกว่า 5 เท่า
          </p>
        </div>

        <div class="rounded-[2rem] glass-strong p-6">
          <p v-if="error" class="mb-3 rounded-2xl bg-rose-400/12 px-4 py-3 text-xs font-bold text-rose-200 ring-1 ring-rose-400/25">
            {{ error }}
          </p>
          <button
            type="submit"
            :disabled="submitting"
            class="w-full rounded-2xl bg-gradient-to-r from-bubble-500 via-night-500 to-night-600 px-5 py-4 text-sm font-extrabold text-white shadow-glow transition hover:-translate-y-1 active:scale-95 disabled:opacity-60"
          >
            {{ submitting ? 'กำลังบันทึก…' : kind === 'found' ? '🫶 ลงประกาศ “เจอแล้ว”' : '🙋 โพสต์ “ทำของหาย”' }}
          </button>
          <p class="mt-3 text-center text-[11px] leading-relaxed text-muted-3">
            โพสต์แล้วทุกคนจะเห็นทันที · แก้ไขหรือลบได้ทุกเมื่อจาก “พื้นที่ของฉัน”
          </p>
        </div>
      </div>
    </form>
  </div>
</template>

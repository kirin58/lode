<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ItemCard from '@/components/ItemCard.vue'
import { api, ApiError } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'
import { useSocialStore } from '@/stores/social'
import { useToastStore } from '@/stores/toast'
import { KIND_META, STATUS_META, CATEGORY_CHIP, timeAgo, formatDate, baht } from '@/lib/format'
import type { Claim, Item } from '@/types'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const social = useSocialStore()
const toast = useToastStore()

const item = ref<Item | null>(null)
const hasClaimed = ref(false)
const similar = ref<Item[]>([])
const loading = ref(true)
const message = ref('')
const submitting = ref(false)
const myClaim = ref<Claim | null>(null)

const kind = computed(() => (item.value ? KIND_META[item.value.kind] : KIND_META.lost))
const status = computed(() => (item.value ? STATUS_META[item.value.status] : STATUS_META.open))
const isOwner = computed(() => Boolean(item.value && auth.user && item.value.owner_id === auth.user.id))
const ownerClaims = computed(() =>
  social.incoming.filter((c) => c.item_id === item.value?.id)
)

async function load() {
  loading.value = true
  try {
    const res = await api.get<{ item: Item; has_claimed: boolean }>(`/items/${route.params.id}`)
    item.value = res.item
    hasClaimed.value = res.has_claimed
    myClaim.value = social.mine.find((c) => c.item_id === res.item.id) ?? null
    const all = await api.get<{ items: Item[] }>('/items?limit=40')
    similar.value = all.items
      .filter((i) => i.id !== res.item.id && i.category_id === res.item.category_id)
      .slice(0, 3)
  } catch {
    toast.error('หาไม่เจอประกาศนี้', 'อาจถูกลบไปแล้ว หรือลิงก์ผิดพลาด')
    router.push('/browse')
  } finally {
    loading.value = false
  }
}

async function submitClaim() {
  if (!item.value) return
  submitting.value = true
  try {
    await social.claim(item.value.id, message.value)
    hasClaimed.value = true
    myClaim.value = social.mine.find((c) => c.item_id === item.value!.id) ?? null
    message.value = ''
    toast.success('ส่งคำขอแล้ว!', 'เจ้าของจะเห็นและติดต่อกลับนะ 🙋')
  } catch (err) {
    toast.error('ส่งไม่สำเร็จ', err instanceof ApiError ? err.message : 'ลองใหม่อีกครั้ง')
  } finally {
    submitting.value = false
  }
}

async function decide(claim: Claim, action: 'approved' | 'rejected') {
  try {
    await social.decide(claim.id, action)
    if (action === 'approved') {
      toast.party('คืนของสำเร็จ!', 'ขอบคุณที่ช่วยกันนะ 💚', '🎊')
      await load()
    } else {
      toast.info('ปฏิเสธคำขอแล้ว', 'ระบบเปิดประกาศให้คนอื่นต่อ')
    }
  } catch (err) {
    toast.error('ทำไม่ได้', err instanceof ApiError ? err.message : undefined)
  }
}

async function markReturned() {
  if (!item.value) return
  try {
    await api.patch(`/items/${item.value.id}`, { status: 'returned' })
    toast.party('ปิดเคสเรียบร้อย', 'ได้ของคืนแล้ว สุดท้าย 💚')
    await load()
  } catch (err) {
    toast.error('อัปเดตไม่สำเร็จ', err instanceof ApiError ? err.message : undefined)
  }
}

async function remove() {
  if (!item.value) return
  if (!confirm('ลบประกาศนี้ใช่ไหม? กู้คืนไม่ได้นะ')) return
  try {
    await api.del(`/items/${item.value.id}`)
    toast.info('ลบประกาศแล้ว', 'ขอบคุณที่ดูแลบอร์ดนะ 👋')
    router.push('/mine')
  } catch (err) {
    toast.error('ลบไม่สำเร็จ', err instanceof ApiError ? err.message : undefined)
  }
}

function copyLink() {
  navigator.clipboard?.writeText(window.location.href)
  toast.info('คัดลอกลิงก์แล้ว', 'ส่งให้เพื่อนไว้หาได้เลย 🔗')
}

onMounted(async () => {
  await auth.init()
  if (auth.isAuthed) await social.loadAll()
  await load()
})
watch(() => route.params.id, load)
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-8 sm:px-6">
    <button
      class="mb-5 inline-flex items-center gap-2 rounded-2xl glass px-3.5 py-2 text-xs font-bold text-night-200 transition hover:bg-white/12"
      @click="router.back()"
    >
      ← ย้อนกลับ
    </button>

    <div v-if="loading" class="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <div class="skeleton aspect-4/3 w-full rounded-[2rem]" />
      <div class="space-y-4">
        <div class="skeleton h-8 w-3/4 rounded-2xl" />
        <div class="skeleton h-4 w-full rounded-xl" />
        <div class="skeleton h-32 w-full rounded-3xl" />
      </div>
    </div>

    <div v-else-if="item" class="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <!-- cover + info -->
      <div class="space-y-5 animate-rise">
        <div class="relative aspect-4/3 overflow-hidden rounded-[2rem] glass">
          <div class="absolute inset-0 bg-gradient-to-br" :class="kind.gradient" />
          <div class="absolute inset-0 dotgrid opacity-30" />
          <img
            v-if="item.image_url"
            :src="item.image_url"
            :alt="item.title"
            class="relative h-full w-full object-cover"
          />
          <span
            v-else
            class="absolute inset-0 grid place-items-center text-[9rem] drop-shadow-2xl animate-float"
          >
            {{ item.category?.emoji ?? '✨' }}
          </span>
          <div class="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent" />

          <div class="absolute inset-x-4 top-4 flex items-start justify-between gap-2">
            <span
              class="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-extrabold ring-1 backdrop-blur-md"
              :class="kind.chip"
            >
              {{ kind.emoji }} {{ kind.label }}
            </span>
            <span
              v-if="item.reward > 0"
              class="animate-ring rounded-full bg-lime-pop px-3 py-1.5 text-xs font-extrabold text-ink"
            >
              รางวัล {{ baht(item.reward) }}
            </span>
          </div>
          <div class="absolute inset-x-4 bottom-4 flex flex-wrap gap-2">
            <span
              class="inline-flex items-center gap-1.5 rounded-full bg-ink/70 px-3 py-1.5 text-xs font-semibold ring-1 ring-white/15 backdrop-blur"
            >
              <span class="size-1.5 rounded-full" :class="status.dot" />
              {{ status.emoji }} {{ status.label }}
            </span>
            <span
              class="rounded-full bg-ink/70 px-3 py-1.5 text-xs font-semibold ring-1 ring-white/15 backdrop-blur"
              :class="CATEGORY_CHIP[item.category?.color ?? 'slate']"
            >
              {{ item.category?.emoji }} {{ item.category?.label }}
            </span>
          </div>
        </div>

        <div class="rounded-[2rem] glass p-6">
          <h1 class="font-display text-2xl font-black leading-tight sm:text-3xl">
            {{ item.title }}
          </h1>
          <p class="mt-4 whitespace-pre-line text-sm leading-relaxed text-night-200">
            {{ item.description || 'ไม่มีรายละเอียดเพิ่มเติม' }}
          </p>

          <div class="mt-6 grid gap-3 sm:grid-cols-2">
            <div class="flex items-center gap-3 rounded-2xl bg-white/5 p-3.5 ring-1 ring-white/8">
              <span class="grid size-10 place-items-center rounded-xl bg-white/8 text-lg">📍</span>
              <div class="min-w-0">
                <p class="text-[11px] text-night-400">สถานที่</p>
                <p class="truncate text-sm font-bold">{{ item.location || 'ไม่ระบุ' }}</p>
              </div>
            </div>
            <div class="flex items-center gap-3 rounded-2xl bg-white/5 p-3.5 ring-1 ring-white/8">
              <span class="grid size-10 place-items-center rounded-xl bg-white/8 text-lg">📅</span>
              <div class="min-w-0">
                <p class="text-[11px] text-night-400">วันที่เกิดเหตุ</p>
                <p class="truncate text-sm font-bold">{{ formatDate(item.occurred_at) }}</p>
              </div>
            </div>
            <div class="flex items-center gap-3 rounded-2xl bg-white/5 p-3.5 ring-1 ring-white/8">
              <span class="grid size-10 place-items-center rounded-xl bg-white/8 text-lg">💬</span>
              <div class="min-w-0">
                <p class="text-[11px] text-night-400">ช่องทางติดต่อ</p>
                <p class="truncate text-sm font-bold">{{ item.contact_line || 'ดูในแชท' }}</p>
              </div>
            </div>
            <div class="flex items-center gap-3 rounded-2xl bg-white/5 p-3.5 ring-1 ring-white/8">
              <span class="grid size-10 place-items-center rounded-xl bg-white/8 text-lg">🕒</span>
              <div class="min-w-0">
                <p class="text-[11px] text-night-400">ลงประกาศ</p>
                <p class="truncate text-sm font-bold">{{ timeAgo(item.created_at) }}</p>
              </div>
            </div>
          </div>

          <div class="mt-5 flex items-center gap-3 rounded-2xl bg-white/5 p-4 ring-1 ring-white/8">
            <span
              class="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-night-500 to-bubble-500 text-2xl"
            >
              {{ item.owner?.avatar_emoji ?? '👤' }}
            </span>
            <div class="min-w-0 flex-1">
              <p class="truncate font-display text-sm font-extrabold">
                {{ item.owner?.display_name }}
              </p>
              <p class="truncate text-[11px] text-night-400">
                {{ item.owner?.campus ?? 'ไม่ระบุสถานที่ศึกษา' }}
              </p>
            </div>
            <button
              class="shrink-0 rounded-2xl bg-white/8 px-3.5 py-2 text-xs font-bold ring-1 ring-white/10 transition hover:bg-white/16"
              @click="copyLink"
            >
              🔗 แชร์
            </button>
          </div>
        </div>
      </div>

      <!-- action panel -->
      <aside class="space-y-5">
        <div class="sticky top-24 space-y-4">
          <!-- owner panel -->
          <div v-if="isOwner" class="rounded-[2rem] glass-strong p-6 animate-pop-in">
            <h2 class="font-display text-lg font-extrabold">นี่ประกาศของคุณ 🎯</h2>
            <p class="mt-1.5 text-sm text-night-300">
              มีคนขอรับ {{ ownerClaims.length }} คน · คนยอมจอย {{ item.claim_count }}
            </p>

            <div class="mt-5 space-y-3">
              <div
                v-for="c in ownerClaims"
                :key="c.id"
                class="rounded-2xl bg-white/5 p-4 ring-1 ring-white/8"
              >
                <div class="flex items-center gap-2.5">
                  <span class="grid size-9 place-items-center rounded-xl bg-white/10 text-lg">
                    {{ c.claimant?.avatar_emoji ?? '👤' }}
                  </span>
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-bold">{{ c.claimant?.display_name }}</p>
                    <p class="text-[11px] text-night-400">{{ timeAgo(c.created_at) }}</p>
                  </div>
                  <span
                    class="rounded-full px-2.5 py-1 text-[10px] font-extrabold"
                    :class="
                      c.status === 'approved'
                        ? 'bg-lime-pop/15 text-lime-pop'
                        : c.status === 'rejected'
                          ? 'bg-rose-400/15 text-rose-300'
                          : 'bg-mango-400/15 text-mango-300'
                    "
                  >
                    {{ c.status === 'approved' ? 'อนุมัติแล้ว' : c.status === 'rejected' ? 'ปฏิเสธ' : 'รอตอบ' }}
                  </span>
                </div>
                <p v-if="c.message" class="mt-2.5 text-xs leading-relaxed text-night-200">
                  “{{ c.message }}”
                </p>
                <div v-if="c.status === 'pending'" class="mt-3 flex gap-2">
                  <button
                    class="flex-1 rounded-xl bg-lime-pop px-3 py-2 text-xs font-extrabold text-ink transition hover:brightness-110 active:scale-95"
                    @click="decide(c, 'approved')"
                  >
                    ✓ ใช่ของเขา
                  </button>
                  <button
                    class="flex-1 rounded-xl bg-white/8 px-3 py-2 text-xs font-bold ring-1 ring-white/10 transition hover:bg-white/16"
                    @click="decide(c, 'rejected')"
                  >
                    ✕ ไม่ใช่
                  </button>
                </div>
              </div>
              <p v-if="!ownerClaims.length" class="rounded-2xl bg-white/5 p-5 text-center text-sm text-night-300">
                ยังไม่มีคนขอรับของชิ้นนี้ 😌
              </p>
            </div>

            <div class="mt-5 flex flex-col gap-2">
              <button
                v-if="item.status !== 'returned'"
                class="rounded-2xl bg-gradient-to-r from-lime-pop to-mint-pop px-4 py-3 text-sm font-extrabold text-ink transition hover:-translate-y-0.5"
                @click="markReturned"
              >
                🎉 ทำเครื่องหมายว่าได้ของคืนแล้ว
              </button>
              <button
                class="rounded-2xl bg-white/8 px-4 py-3 text-sm font-bold text-rose-300 ring-1 ring-white/10 transition hover:bg-rose-400/12"
                @click="remove"
              >
                🗑️ ลบประกาศนี้
              </button>
            </div>
          </div>

          <!-- claimant panel -->
          <div v-else class="rounded-[2rem] glass-strong p-6 animate-pop-in">
            <template v-if="item.status === 'returned'">
              <div class="text-center">
                <div class="text-5xl">🎉</div>
                <h2 class="mt-3 font-display text-lg font-extrabold">ได้ของคืนเรียบร้อยแล้ว</h2>
                <p class="mt-1.5 text-sm text-night-300">
                  ขอบคุณที่ช่วยกันนะ ไว้เจอกันในสถานการณ์อื่น 💚
                </p>
              </div>
            </template>

            <template v-else-if="hasClaimed">
              <div class="text-center">
                <div class="text-5xl">🙋</div>
                <h2 class="mt-3 font-display text-lg font-extrabold">คุณส่งคำขอไปแล้วนะ</h2>
                <p class="mt-1.5 text-sm text-night-300">
                  เจ้าของจะเห็นข้อความของคุณแล้ว รอสักครู่นะ
                </p>
                <p
                  v-if="myClaim"
                  class="mt-3 inline-block rounded-full px-3 py-1.5 text-xs font-extrabold"
                  :class="
                    myClaim.status === 'approved'
                      ? 'bg-lime-pop/15 text-lime-pop'
                      : myClaim.status === 'rejected'
                        ? 'bg-rose-400/15 text-rose-300'
                        : 'bg-mango-400/15 text-mango-300'
                  "
                >
                  {{ myClaim.status === 'approved' ? '✓ ได้รับอนุมัติแล้ว' : myClaim.status === 'rejected' ? '✕ ถูกปฏิเสธ' : '⏳ รอเจ้าของตอบ' }}
                </p>
              </div>
            </template>

            <template v-else-if="auth.isAuthed">
              <h2 class="font-display text-lg font-extrabold">น่าจะเป็นของคุณใช่ไหม? 👀</h2>
              <p class="mt-1.5 text-sm text-night-300">
                เขียนรายละเอียดที่จำได้ เช่น สี ตรา หรือจุดที่หาเจอ เจ้าของจะใช้ตัดสินใจ
              </p>
              <textarea
                v-model="message"
                rows="4"
                maxlength="600"
                placeholder="เช่น เป็นไอโพดสีขาว มีรอยขีดข้างกล่องซ้าย..."
                class="mt-4 w-full resize-none rounded-2xl bg-white/6 p-4 text-sm outline-none ring-1 ring-white/10 transition placeholder:text-night-400 focus:ring-lime-pop/60"
              />
              <div class="mt-2 flex justify-end text-[11px] text-night-400">
                {{ message.length }}/600
              </div>
              <button
                class="mt-3 w-full rounded-2xl bg-gradient-to-r from-bubble-500 to-night-500 px-4 py-3.5 text-sm font-extrabold text-white shadow-glow transition hover:-translate-y-0.5 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="submitting"
                @click="submitClaim"
              >
                {{ submitting ? 'กำลังส่ง…' : 'ยืนยันว่าเป็นของฉัน' }}
              </button>
            </template>

            <template v-else>
              <h2 class="font-display text-lg font-extrabold">อยากรับของชิ้นนี้?</h2>
              <p class="mt-1.5 text-sm text-night-300">
                สมัครสมาชิกฟรี แล้วกดยืนยันว่าเป็นของคุณได้เลย
              </p>
              <RouterLink
                :to="{ path: '/login', query: { redirect: `/item/${item.id}` } }"
                class="mt-4 block w-full rounded-2xl bg-gradient-to-r from-bubble-500 to-night-500 px-4 py-3.5 text-center text-sm font-extrabold text-white shadow-glow transition hover:-translate-y-0.5"
              >
                เข้าสู่ระบบเพื่อยืนยัน
              </RouterLink>
              <RouterLink
                :to="{ path: '/register', query: { redirect: `/item/${item.id}` } }"
                class="mt-2 block w-full rounded-2xl bg-white px-4 py-3.5 text-center text-sm font-extrabold text-ink transition hover:-translate-y-0.5"
              >
                สมัครสมาชิกฟรี ✨
              </RouterLink>
            </template>
          </div>

          <!-- tips -->
          <div class="rounded-[2rem] glass p-5">
            <h3 class="font-display text-sm font-extrabold">💡 เคล็ดลับ</h3>
            <ul class="mt-3 space-y-2 text-xs leading-relaxed text-night-300">
              <li>• ยินดีจ่ายรางวัลช่วยเพิ่มโอกาสได้ของคืนแบบ x3</li>
              <li>• เขียนจุดสังเกตเฉพาะ (สี/รอย/ตรา) ช่วยได้เยอะมาก</li>
              <li>• นัดเจอที่จุดสาธารณะ ปลอดภัยกว่านะ 🔒</li>
            </ul>
          </div>
        </div>
      </aside>
    </div>

    <!-- similar -->
    <section v-if="similar.length" class="mt-16">
      <h2 class="font-display text-2xl font-black">ของใกล้เคียง 🔍</h2>
      <div class="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ItemCard v-for="s in similar" :key="s.id" :item="s" />
      </div>
    </section>
  </div>
</template>

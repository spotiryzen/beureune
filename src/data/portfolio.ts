export interface ProjectItem {
  id: string;
  index: string;
  title: string;
  subtitle: string;
  discipline: string;
  year: string;
  image: string;
  imageAlt: string;
  caption: string;
  stack: string[];
  problem: string;
  execution: string;
  outcome: string;
  metrics: string;
}

export interface BioKeywordPreview {
  key: string;
  label: string;
  projectId: string;
  image: string;
  imageAlt: string;
  caption: string;
}

export const PROFILE = {
  name: 'Beureune',
  role: 'Arsitek Alur Kerja AI & Kreator Teknologi',
  location: 'Banda Aceh, Indonesia',
  timezone: 'Asia/Jakarta',
  timezoneLabel: 'WIB',
  availability: 'Tersedia untuk proyek Q4',
  email: 'spotiryzen@gmail.com',
  instagramHandle: '@beureune',
  instagramUrl: 'https://instagram.com/beureune',
  githubUrl: 'https://github.com/beureune',
  linkedinUrl: 'https://linkedin.com/in/beureune',
  heroLines: [
    'Mengubah AI menjadi',
    'alur kerja yang',
    'benar-benar berguna.',
  ],
};

export const PROJECTS: ProjectItem[] = [
  {
    id: 'financial-gold-chatbot',
    index: '01',
    title: 'Chatbot Keuangan & Harga Emas',
    subtitle: 'Cek Harga Emas & Kurs Mata Uang Harian',
    discipline: 'Otomasi n8n & AI',
    year: '2026',
    image: '/src/assets/images/project_gold_chatbot_1795580438586.jpg',
    imageAlt: 'Emas batangan 24 karat di samping ponsel hitam matte di atas batu travertine hangat',
    caption: 'Bot pemantau harga emas & kurs IDR harian berbasis n8n',
    stack: ['n8n', 'API WhatsApp & Telegram', 'Router Intensi LLM', 'Data Emas & Kurs Real-Time'],
    problem:
      'Investor ritel dan pembeli emas lokal harus membandingkan harga Antam, UBS, serta kurs IDR secara manual di banyak situs setiap pagi sebelum mengambil keputusan transaksi.',
    execution:
      'Merancang alur kerja n8n terjadwal dan on-demand yang terhubung ke sumber harga logam mulia dan valuta asing. Pemroses bahasa memahami pertanyaan kasual bahasa Indonesia untuk menghitung gramasi, selisih buyback, dan konversi USD/IDR langsung di chat.',
    outcome:
      'Memangkas waktu pengecekan harian dari lima menit berpindah tab menjadi satu pesan singkat dengan respons di bawah 2 detik serta ringkasan pasar otomatis tiap pagi.',
    metrics: 'Respons < 2 detik · Ringkasan otomatis 08.00 WIB',
  },
  {
    id: 'video-ai-commercials',
    index: '02',
    title: 'Video Iklan Berbasis AI',
    subtitle: 'Produksi Visual & Audio Komersial Generatif',
    discipline: 'Visual & Audio Generatif',
    year: '2026',
    image: '/src/assets/images/project_video_ai_1795580439244.jpg',
    imageAlt: 'Adegan iklan editorial botol kaca amber dan balok plester dalam pencahayaan matahari studio',
    caption: 'Alur produksi film iklan generatif dari konsep hingga akhir',
    stack: ['Model Video Generatif', 'Arahan Keyframe', 'Sintesis Sulih Suara', 'Tata Suara & Warna'],
    problem:
      'Merek lokal membutuhkan video iklan produk berstandar komersial untuk peluncuran musiman tanpa biaya produksi studio besar atau jadwal syuting berminggu-minggu.',
    execution:
      'Membangun alur produksi terstruktur yang menggabungkan perancangan keyframe terarah, sintesis gerakan kamera yang terkontrol, sulih suara bahasa Indonesia, serta penyesuaian warna bergaya editorial.',
    outcome:
      'Menghasilkan materi iklan siap tayang berdurasi 15–30 detik (format vertikal dan layar lebar) dalam 48 jam per produk, sehingga merek bisa menguji beberapa variasi visual sebelum menaikkan anggaran iklan.',
    metrics: '48 jam dari konsep ke tayang · Format vertikal & lanskap',
  },
  {
    id: 'fmcg-field-ops-copilot',
    index: '03',
    title: 'Asisten Operasional FMCG',
    subtitle: 'Rekonsiliasi Order & Stok Distributor Harian',
    discipline: 'Otomasi Alur Kerja',
    year: '2025',
    image: '/src/assets/images/project_fmcg_ops_1795580440347.jpg',
    imageAlt: 'Karton pasokan tersusun rapi di rak baja matte dalam gudang modern bermandikan cahaya pagi',
    caption: 'Ekstraksi pesanan WhatsApp & laporan stok gudang otomatis',
    stack: ['n8n', 'Ekstraksi Data Terstruktur', 'Sinkronisasi Sheets & ERP', 'Notifikasi Anomali'],
    problem:
      'Berangkat dari pengalaman langsung di distribusi FMCG: tim lapangan mengirim pesanan restok dan catatan toko lewat chat tak terstruktur, menyebabkan salah input manual dan kekosongan stok yang terlambat diketahui.',
    execution:
      'Menyusun alur otomasi yang membaca pesan pesanan masuk menjadi daftar SKU tervalidasi, membandingkannya dengan stok gudang berjalan, lalu menyusun ringkasan pengiriman untuk tim pagi.',
    outcome:
      'Menghapus pekerjaan salin-tempel manual setiap akhir hari dan memberi supervisor area visibilitas langsung atas produk cepat habis sebelum muat armada pagi.',
    metrics: 'Nol input manual · Persiapan pengiriman 70% lebih cepat',
  },
  {
    id: 'editorial-web-systems',
    index: '04',
    title: 'Sistem Web Editorial',
    subtitle: 'Antarmuka Web & Katalog Digital Ringkas',
    discipline: 'Desain & Rekayasa Antarmuka',
    year: '2025',
    image: '/src/assets/images/project_web_systems_1795580440916.jpg',
    imageAlt: 'Tampilan atas laptop aluminium matte menampilkan tata letak tipografi bersih di atas meja batu travertine',
    caption: 'Antarmuka digital cepat dan ringan untuk bisnis independen',
    stack: ['TypeScript', 'React & Tailwind CSS', 'Sistem Grid Editorial', 'Optimasi Performa'],
    problem:
      'Banyak bisnis daerah memakai templat situs berat yang lambat dibuka di jaringan seluler dan mengaburkan penawaran utama di balik elemen visual yang berlebihan.',
    execution:
      'Membangun situs satu halaman berbasis tipografi dengan anggaran performa ketat, alur kontak WhatsApp/email yang langsung, serta interaksi mikro yang responsif.',
    outcome:
      'Waktu muat di bawah satu detik pada koneksi seluler dan penyampaian profil produk yang jauh lebih jelas tanpa hambatan bagi calon klien.',
    metrics: 'Muat seluler < 1 detik · Arsitektur ringan & terukur',
  },
];

export const BIO_KEYWORDS: Record<string, BioKeywordPreview> = {
  chatbots: {
    key: 'chatbots',
    label: 'chatbot otomatis',
    projectId: 'financial-gold-chatbot',
    image: PROJECTS[0].image,
    imageAlt: PROJECTS[0].imageAlt,
    caption: '01 · Chatbot Keuangan & Harga Emas (n8n)',
  },
  media: {
    key: 'media',
    label: 'alur produksi media generatif',
    projectId: 'video-ai-commercials',
    image: PROJECTS[1].image,
    imageAlt: PROJECTS[1].imageAlt,
    caption: '02 · Video Iklan Berbasis AI',
  },
  interfaces: {
    key: 'interfaces',
    label: 'antarmuka web yang ringkas',
    projectId: 'editorial-web-systems',
    image: PROJECTS[3].image,
    imageAlt: PROJECTS[3].imageAlt,
    caption: '04 · Sistem Web Editorial',
  },
};

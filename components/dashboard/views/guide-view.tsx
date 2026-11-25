import { faDownload } from "@fortawesome/free-solid-svg-icons";
import Icon from "@/components/icon";
import { Panel } from "../ui";

export default function GuideView() {
  return (
    <div className="guide-content">
      <Panel
        className="guide-panel"
        title="Mulai di sini"
        subtitle="Panduan singkat untuk mencatat pekerjaan, memperbarui progres, dan berkolaborasi."
        aside={
          <a className="primary-button guide-download" href="/panduan-pengguna.docx" download>
            <Icon icon={faDownload} /> Unduh panduan Word
          </a>
        }
      >
        <ol className="guide-steps">
          <li><strong>Buat atau buka proyek</strong><span>Kelompokkan pekerjaan berdasarkan tujuan atau kegiatan tim.</span></li>
          <li><strong>Catat tugas dengan jelas</strong><span>Tentukan hasil yang diharapkan, penanggung jawab, prioritas, dan tenggat.</span></li>
          <li><strong>Perbarui progres</strong><span>Ubah status saat pekerjaan bergerak dan beri kabar kepada rekan terkait.</span></li>
          <li><strong>Tinjau hasil</strong><span>Gunakan Kalender, Timeline, atau Laporan untuk melihat tenggat dan progres.</span></li>
        </ol>
      </Panel>

      <div className="guide-grid">
        <Panel className="guide-panel" title="Membuat dan mengelola tugas" subtitle="Catat informasi yang membantu pekerjaan bergerak.">
          <ol className="guide-list">
            <li>Pilih <strong>Buat Tugas</strong> dari Dashboard, Tugas Saya, Board Kanban, Kalender, atau Timeline.</li>
            <li>Isi nama tugas dan deskripsi, lalu tentukan prioritas, tanggal mulai, tenggat, penanggung jawab, dan proyek.</li>
            <li>Gunakan label untuk kategori dan pengulangan untuk pekerjaan rutin harian, mingguan, atau bulanan.</li>
            <li>Buka detail tugas untuk menambah checklist, pelaksana, pengamat, dependensi, komentar, lampiran, tautan, dan catatan waktu.</li>
          </ol>
          <p className="guide-note"><strong>Alur status:</strong> Belum Mulai → Berjalan → Menunggu Review → Selesai.</p>
        </Panel>

        <Panel className="guide-panel" title="Pilih tampilan yang sesuai" subtitle="Menu menampilkan pekerjaan dengan cara yang berbeda.">
          <ul className="guide-list">
            <li><strong>Dashboard:</strong> ringkasan progres, proyek, dan aktivitas terbaru.</li>
            <li><strong>Tugas Saya:</strong> tugas yang ditugaskan kepada Anda atau menandai Anda.</li>
            <li><strong>Board Kanban:</strong> pindahkan kartu antarstatus untuk memperbarui alur kerja.</li>
            <li><strong>Kalender:</strong> lihat tugas bertenggat per bulan atau minggu; pengguna yang berwenang dapat menggeser jadwal dengan menyeret kartu.</li>
            <li><strong>Timeline:</strong> tinjau rentang tugas per proyek atau per orang, dalam skala hari atau minggu.</li>
            <li><strong>Laporan:</strong> pantau penyelesaian, keterlambatan, tren, kesehatan proyek, dan waktu tercatat.</li>
          </ul>
        </Panel>

        <Panel className="guide-panel" title="Bekerja bersama tim" subtitle="Simpan konteks pekerjaan dekat dengan tugasnya.">
          <ul className="guide-list">
            <li>Tulis komentar untuk pertanyaan atau keputusan; ketik <strong>@</strong> untuk menyebut rekan.</li>
            <li>Tambahkan pelaksana yang ikut bekerja dan tag pengamat yang perlu mengetahui tugas.</li>
            <li>Catat hambatan di bagian kendala dan lampirkan bukti yang relevan.</li>
            <li>Gunakan Chat untuk percakapan langsung atau grup. Enter mengirim pesan; Shift+Enter membuat baris baru.</li>
            <li>Pilih ikon pemberitahuan untuk membuka tugas terkait, atau muat ulang data dari bilah atas.</li>
          </ul>
        </Panel>

        <Panel className="guide-panel" title="Peran dan akses" subtitle="Menu dan tindakan yang terlihat bergantung pada peran akun.">
          <ul className="guide-list">
            <li><strong>Karyawan:</strong> melihat tugas milik, tugas yang ditugaskan, atau tugas yang menandai dirinya.</li>
            <li><strong>Supervisor:</strong> mengelola pekerjaan divisi dan pengaturan operasional yang tersedia.</li>
            <li><strong>Manager:</strong> mengelola pekerjaan serta label, batas WIP, templat, dan formulir.</li>
            <li><strong>Administrator dan Super Admin:</strong> mengelola anggota dan seluruh pengaturan administratif.</li>
            <li><strong>Tamu / Klien:</strong> melihat tugas yang dibagikan; dapat berkomentar dan melampirkan berkas sesuai akses.</li>
          </ul>
          <p className="guide-note">Jika menu atau tindakan tidak tersedia, hubungi administrator untuk memeriksa peran dan akses akun.</p>
        </Panel>

        <Panel className="guide-panel" title="Jika ada kendala" subtitle="Periksa hal berikut sebelum meminta bantuan.">
          <ul className="guide-list">
            <li>Tugas tidak terlihat: hapus filter yang aktif dan periksa penanggung jawab atau tag.</li>
            <li>Tugas tidak muncul di Kalender: Kalender hanya menampilkan tugas yang memiliki tenggat.</li>
            <li>Perubahan belum tampak: pilih muat ulang pada bilah atas.</li>
            <li>Tidak bisa masuk: periksa email dan kata sandi, lalu minta admin memastikan akun aktif.</li>
          </ul>
        </Panel>
      </div>
    </div>
  );
}

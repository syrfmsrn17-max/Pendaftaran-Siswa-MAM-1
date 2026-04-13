// --- Global Variables & Initialization ---
let students = JSON.parse(localStorage.getItem('mamsaka_ppdb_students')) || [];

document.addEventListener('DOMContentLoaded', () => {
    initClock();
    initTheme();
    initNavigation();
    initFlatpickr();
    updateDashboardStats();
    renderStudentTable();
});

// --- Date & Time ---
function initClock() {
    const dateEl = document.getElementById('current-date');
    const timeEl = document.getElementById('current-time');
    
    const updateTime = () => {
        const now = new Date();
        const optionsDate = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateEl.textContent = now.toLocaleDateString('id-ID', optionsDate);
        
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        timeEl.textContent = `${hours}:${minutes}:${seconds}`;
    };
    
    updateTime();
    setInterval(updateTime, 1000);
}

// --- Theme Toggle (Dark Mode) ---
function initTheme() {
    const themeBtn = document.getElementById('theme-toggle');
    const toggleSwitch = document.getElementById('darkModeToggleSwitch');
    const htmlEl = document.documentElement;
    const flatpickrDarkTheme = document.getElementById('flatpickr-dark-theme');
    
    // Check saved theme
    const savedTheme = localStorage.getItem('mamsaka_theme') || 'light';
    setTheme(savedTheme);
    
    if(toggleSwitch) {
        toggleSwitch.checked = (savedTheme === 'dark');
        toggleSwitch.addEventListener('change', (e) => {
            setTheme(e.target.checked ? 'dark' : 'light');
        });
    }

    themeBtn.addEventListener('click', () => {
        const currentTheme = htmlEl.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        if(toggleSwitch) toggleSwitch.checked = (newTheme === 'dark');
    });

    function setTheme(theme) {
        htmlEl.setAttribute('data-theme', theme);
        localStorage.setItem('mamsaka_theme', theme);
        
        // Update Icon
        themeBtn.innerHTML = theme === 'dark' ? '<i class="ri-sun-line"></i>' : '<i class="ri-moon-line"></i>';
        
        // Toggle Flatpickr dark theme css disabled state
        if(flatpickrDarkTheme) {
            flatpickrDarkTheme.disabled = theme !== 'dark';
        }
    }
}

// --- Navigation & Sidebar ---
function initNavigation() {
    const toggleBtn = document.getElementById('toggle-sidebar');
    const closeBtn = document.getElementById('close-sidebar');
    const sidebar = document.querySelector('.sidebar');
    const navItems = document.querySelectorAll('#nav-list li');
    
    // Mobile Sidebar Toggle
    toggleBtn.addEventListener('click', () => sidebar.classList.add('show'));
    closeBtn.addEventListener('click', () => sidebar.classList.remove('show'));
    
    // Nav Click
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // Remove active classes
            navItems.forEach(n => n.classList.remove('active'));
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            
            // Add active class to clicked item and corresponding page
            item.classList.add('active');
            const targetId = item.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
            
            // On mobile, close sidebar after clicking
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('show');
            }
            
            // If navigating to Dashboard, update stats
            if(targetId === 'dashboard') {
                updateDashboardStats();
            }
        });
    });
}

function navigateTo(targetId) {
    const navItem = document.querySelector(`#nav-list li[data-target="${targetId}"]`);
    if(navItem) navItem.click();
}

// --- Form & Input Handling ---
function initFlatpickr() {
    flatpickr("#tanggalLahir", {
        dateFormat: "d F Y",
        locale: "id",
        onChange: function(selectedDates, dateStr, instance) {
            if (selectedDates.length > 0) {
                calculateAge(selectedDates[0]);
            }
        }
    });
}

function calculateAge(birthDate) {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    const ageHtml = age >= 0 ? `${age} Tahun` : '0 Tahun';
    document.getElementById('umurSiswa').value = ageHtml;
}

// Foto preview and Base64 conversion
document.getElementById('fotoSiswa').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Check size (max 1MB)
    if (file.size > 1024 * 1024) {
        Swal.fire('Peringatan', 'Ukuran foto maksimal 1MB!', 'warning');
        this.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
        const base64Str = event.target.result;
        document.getElementById('fotoBase64').value = base64Str;
        
        const previewImg = document.getElementById('imgPreview');
        previewImg.src = base64Str;
        previewImg.style.display = 'block';
        document.getElementById('previewIconText').style.display = 'none';
    };
    reader.readAsDataURL(file);
});

// --- CRUD Operations ---
function handleFormSubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('student_id').value;
    const isEdit = id !== '';
    
    // Gather data
    const newStudent = {
        id: isEdit ? id : Date.now().toString(),
        nama: document.getElementById('namaSiswa').value,
        jk: document.querySelector('input[name="jk"]:checked').value,
        tempatLahir: document.getElementById('tempatLahir').value,
        tanggalLahir: document.getElementById('tanggalLahir').value,
        umur: document.getElementById('umurSiswa').value,
        kelas: document.getElementById('kelasMasuk').value,
        jurusan: document.getElementById('jurusanMasuk').value,
        alamat: document.getElementById('alamatSiswa').value,
        foto: document.getElementById('fotoBase64').value || null,
        statusPembayaran: document.querySelector('input[name="statusPembayaran"]:checked').value,
        tanggalDaftar: new Date().toISOString()
    };
    
    if (isEdit) {
        const index = students.findIndex(s => s.id === id);
        if (index > -1) {
            // retain old photo if not changed
            if(!newStudent.foto && students[index].foto) {
                newStudent.foto = students[index].foto;
            }
            students[index] = newStudent;
        }
    } else {
        students.push(newStudent);
    }
    
    saveData();
    resetForm();
    
    // Nice Animation / Notification
    Swal.fire({
        title: isEdit ? 'Data Diperbarui!' : 'Pendaftaran Berhasil!',
        text: `Data untuk ${newStudent.nama} telah disimpan.`,
        icon: 'success',
        confirmButtonColor: '#3b82f6'
    }).then(() => {
        navigateTo('student-data');
    });
}

function resetForm() {
    document.getElementById('studentDataForm').reset();
    document.getElementById('student_id').value = '';
    document.getElementById('fotoBase64').value = '';
    document.getElementById('umurSiswa').value = '';
    
    // Reset photo preview
    document.getElementById('imgPreview').style.display = 'none';
    document.getElementById('imgPreview').src = '';
    document.getElementById('previewIconText').style.display = 'block';
    
    // Reset payment radio
    const paymentRadios = document.querySelectorAll(`input[name="statusPembayaran"]`);
    if(paymentRadios.length) paymentRadios[0].checked = true;

    document.getElementById('form-title').innerText = 'Pendaftaran Siswa Baru';
}

function saveData() {
    localStorage.setItem('mamsaka_ppdb_students', JSON.stringify(students));
    renderStudentTable();
    updateDashboardStats();
}

function renderStudentTable() {
    const tbody = document.getElementById('studentTableBody');
    const emptyState = document.getElementById('emptyState');
    const table = document.getElementById('studentsTable');
    
    const searchInput = document.getElementById('searchInput') ? document.getElementById('searchInput').value.toLowerCase() : '';
    const filterKelas = document.getElementById('filterKelas') ? document.getElementById('filterKelas').value : '';
    const filterJurusan = document.getElementById('filterJurusan') ? document.getElementById('filterJurusan').value : '';
    
    tbody.innerHTML = '';
    
    const filteredStudents = students.filter(s => {
        const matchName = s.nama.toLowerCase().includes(searchInput) || s.kelas.toLowerCase().includes(searchInput) || s.jurusan.toLowerCase().includes(searchInput);
        const matchKelas = filterKelas === '' || s.kelas === filterKelas;
        const matchJurusan = filterJurusan === '' || s.jurusan === filterJurusan;
        return matchName && matchKelas && matchJurusan;
    });
    
    if (filteredStudents.length === 0) {
        table.style.display = 'none';
        emptyState.style.display = 'block';
    } else {
        table.style.display = 'table';
        emptyState.style.display = 'none';
        
        filteredStudents.forEach((s, index) => {
            const tr = document.createElement('tr');
            
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td class="student-info-cell">
                    <span class="student-name">${s.nama}</span>
                    <span class="student-pob mt-1"><i class="ri-map-pin-line"></i> ${s.alamat.substring(0, 20)}${s.alamat.length > 20 ? '...' : ''}</span>
                    <span class="badge" style="display:inline-block; margin-top:0.5rem; width:fit-content; background:rgba(59,130,246,0.1); color:var(--primary-color)">
                        ${s.jk === 'Laki-laki' ? '<i class="ri-men-line"></i> L' : '<i class="ri-women-line"></i> P'}
                    </span>
                </td>
                <td class="student-info-cell">
                    <span>${s.tempatLahir}, ${s.tanggalLahir}</span>
                    <span class="text-primary font-weight-bold mt-1">Umur: ${s.umur}</span>
                </td>
                <td>
                    <span class="badge badge-primary">${s.kelas} ${s.jurusan}</span>
                </td>
                <td>
                    <span class="badge" style="background:${s.statusPembayaran === 'Lunas' ? 'var(--success)' : 'var(--warning)'}; color:white;">
                        ${s.statusPembayaran === 'Lunas' ? '<i class="ri-check-line"></i> Lunas' : '<i class="ri-error-warning-line"></i> Belum Lunas'}
                    </span>
                </td>
                <td>
                    <div class="action-btns">
                        <button class="btn btn-outline btn-sm text-blue" onclick="exportPDF('${s.id}')" title="Export PDF Bukti"><i class="ri-printer-line"></i></button>
                        <button class="btn btn-outline btn-sm text-primary" onclick="editStudent('${s.id}')" title="Edit"><i class="ri-edit-line"></i></button>
                        <button class="btn btn-outline btn-sm text-danger" onclick="deleteStudent('${s.id}')" title="Hapus"><i class="ri-delete-bin-line"></i></button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }
}

function filterTable() {
    renderStudentTable();
}

function editStudent(id) {
    const student = students.find(s => s.id === id);
    if(!student) return;
    
    document.getElementById('student_id').value = student.id;
    document.getElementById('namaSiswa').value = student.nama;
    
    // Set radio jk
    document.querySelectorAll(`input[name="jk"]`).forEach(r => {
        r.checked = (r.value === student.jk);
    });
    
    document.getElementById('tempatLahir').value = student.tempatLahir;
    
    // set flatpickr
    document.getElementById('tanggalLahir')._flatpickr.setDate(student.tanggalLahir, true);
    
    document.getElementById('umurSiswa').value = student.umur;
    document.getElementById('kelasMasuk').value = student.kelas;
    document.getElementById('jurusanMasuk').value = student.jurusan;
    document.getElementById('alamatSiswa').value = student.alamat;
    
    // Set payment status radio
    const statusVal = student.statusPembayaran || 'Belum';
    document.querySelectorAll(`input[name="statusPembayaran"]`).forEach(r => {
        r.checked = (r.value === statusVal);
    });
    
    // Photo handles
    if(student.foto) {
        document.getElementById('fotoBase64').value = student.foto;
        document.getElementById('imgPreview').src = student.foto;
        document.getElementById('imgPreview').style.display = 'block';
        document.getElementById('previewIconText').style.display = 'none';
    } else {
        document.getElementById('fotoBase64').value = '';
        document.getElementById('imgPreview').style.display = 'none';
        document.getElementById('imgPreview').src = '';
        document.getElementById('previewIconText').style.display = 'block';
    }
    
    document.getElementById('form-title').innerText = 'Edit Data Siswa';
    navigateTo('add-student');
}

function deleteStudent(id) {
    const student = students.find(s => s.id === id);
    if(!student) return;
    
    Swal.fire({
        title: 'Hapus Data?',
        text: `Anda yakin ingin menghapus data pendaftaran ${student.nama}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Ya, Hapus!',
        cancelButtonText: 'Batal'
    }).then((result) => {
        if (result.isConfirmed) {
            students = students.filter(s => s.id !== id);
            saveData();
            Swal.fire('Terhapus!', 'Data siswa berhasil dihapus.', 'success');
        }
    });
}

function clearAllData() {
    Swal.fire({
        title: 'PERINGATAN KERAS!',
        text: "Semua data pendaftar akan terhapus dan tidak dapat dikembalikan. Lanjutkan?",
        icon: 'error',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'HAPUS SEMUA',
        cancelButtonText: 'Batal'
    }).then((result) => {
        if (result.isConfirmed) {
            students = [];
            saveData();
            Swal.fire('Berhasil Terhapus', 'Semua data telah direset.', 'success');
        }
    });
}

// --- Dashboard Stats ---
function updateDashboardStats() {
    // Totals
    const total = students.length;
    const male = students.filter(s => s.jk === 'Laki-laki').length;
    const female = students.filter(s => s.jk === 'Perempuan').length;
    
    document.getElementById('stat-total').innerText = total;
    document.getElementById('stat-male').innerText = male;
    document.getElementById('stat-female').innerText = female;
    
    // Revenue (150k per student)
    const revenue = total * 150000;
    document.getElementById('stat-revenue').innerText = 'Rp ' + revenue.toLocaleString('id-ID');
    
    // Majors breakdown
    const majors = { 'M-ICO': 0, 'ITCP': 0, 'ATCP': 0, 'MIPA': 0, 'AGAMA': 0 };
    const classes = { 'X': 0, 'XI': 0, 'XII': 0 };
    
    students.forEach(s => {
        if(majors[s.jurusan] !== undefined) majors[s.jurusan]++;
        if(classes[s.kelas] !== undefined) classes[s.kelas]++;
    });
    
    // Render Majors
    const majorsHtml = Object.keys(majors).map(m => `<li><span>${m}</span> <span class="badge ${majors[m]>0?'badge-primary':''}">${majors[m]}</span></li>`).join('');
    document.getElementById('stat-majors').innerHTML = majorsHtml;
    
    // Render Classes
    const classesHtml = Object.keys(classes).map(c => `<li><span>Kelas ${c}</span> <span class="badge ${classes[c]>0?'badge-primary':''}">${classes[c]}</span></li>`).join('');
    document.getElementById('stat-classes').innerHTML = classesHtml;
}

// --- Export PDF ---
function exportPDF(id) {
    const student = students.find(s => s.id === id);
    if(!student) return;
    
    // Populate template
    document.getElementById('pdf-id').innerText = `: ${student.id}`;
    document.getElementById('pdf-nama').innerText = `: ${student.nama}`;
    document.getElementById('pdf-jk').innerText = `: ${student.jk}`;
    document.getElementById('pdf-ttl').innerText = `: ${student.tempatLahir}, ${student.tanggalLahir}`;
    document.getElementById('pdf-umur').innerText = `: ${student.umur}`;
    document.getElementById('pdf-jurusan').innerText = `: Kelas ${student.kelas} - ${student.jurusan}`;
    document.getElementById('pdf-status').innerText = `: ${student.statusPembayaran === 'Lunas' ? 'Lunas' : 'Belum Lunas'}`;
    document.getElementById('pdf-alamat').innerText = `: ${student.alamat}`;
    
    const todayStr = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
    document.getElementById('pdf-today').innerText = todayStr;
    document.getElementById('pdf-sign-name').innerText = student.nama;
    
    const imgEl = document.getElementById('pdf-foto');
    const noImgEl = document.getElementById('pdf-nofoto');
    
    if(student.foto) {
        imgEl.src = student.foto;
        imgEl.style.display = 'block';
        noImgEl.style.display = 'none';
    } else {
        imgEl.style.display = 'none';
        noImgEl.style.display = 'flex';
    }
    
    // Generate PDF
    const element = document.getElementById('pdf-content');
    
    // Show wrapper briefly for html2canvas
    document.getElementById('pdf-template-wrapper').style.display = 'block';
    
    const opt = {
        margin:       [0.5, 0.5, 0.5, 0.5],
        filename:     `Bukti_Pendaftaran_${student.nama.replace(/\s+/g, '_')}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, imageTimeout: 1500 },
        jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    Swal.fire({
        title: 'Mempersiapkan PDF...',
        text: 'Sedang merender dokumen, mohon tunggu...',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
            setTimeout(() => {
                html2pdf().set(opt).from(element).save().then(() => {
                    document.getElementById('pdf-template-wrapper').style.display = 'none';
                    Swal.fire('Berhasil!', 'Bukti pendaftaran telah diunduh.', 'success');
                }).catch(err => {
                    console.error("PDF Generate Error: ", err);
                    document.getElementById('pdf-template-wrapper').style.display = 'none';
                    Swal.fire('Catatan', 'Bukti pendaftaran tetap diproses, amati bilah unduhan di browser Anda.', 'info');
                });
            }, 600);
        }
    });
}

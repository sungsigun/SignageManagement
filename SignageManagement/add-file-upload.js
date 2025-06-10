// add-file-upload.js - 파일 업로드 기능 추가
const fs = require('fs');
const path = require('path');

function addFileUploadSystem() {
    console.log('📁 파일 업로드 시스템 구현 시작...');

    // 1. uploads 디렉토리 생성
    const uploadsDir = './uploads';
    const subDirs = ['orders', 'drawings', 'photos', 'documents'];

    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir);
        console.log('✅ uploads 디렉토리 생성');
    }

    subDirs.forEach(dir => {
        const fullPath = path.join(uploadsDir, dir);
        if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath, { recursive: true });
            console.log(`✅ ${fullPath} 디렉토리 생성`);
        }
    });

    // 2. app.js 파일 읽기
    const appPath = './app.js';
    let appContent = fs.readFileSync(appPath, 'utf8');

    // 3. multer 설정 추가
    const multerSetup = `
// Multer 설정 (파일 업로드)
const multer = require('multer');
const path = require('path');

// 파일 저장 설정
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = './uploads/';
    
    // 파일 타입에 따라 저장 경로 결정
    if (req.path.includes('/drawings')) {
      uploadPath += 'drawings/';
    } else if (req.path.includes('/photos')) {
      uploadPath += 'photos/';
    } else if (req.path.includes('/documents')) {
      uploadPath += 'documents/';
    } else {
      uploadPath += 'orders/';
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // 파일명: 타임스탬프_원본파일명
    const timestamp = Date.now();
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    cb(null, timestamp + '_' + originalName);
  }
});

// 파일 필터 (허용할 파일 타입)
const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    drawing: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf', 'image/svg+xml'],
    excel: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
  };
  
  const allAllowed = [...allowedTypes.image, ...allowedTypes.document, ...allowedTypes.drawing, ...allowedTypes.excel];
  
  if (allAllowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('허용되지 않는 파일 형식입니다.'), false);
  }
};

// Multer 인스턴스 생성
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB 제한
    files: 5 // 한 번에 5개 파일까지
  }
});

`;

    // 4. 파일 업로드 API 추가
    const fileUploadAPIs = `
// 파일 업로드 API들

// 주문 관련 파일 업로드
app.post('/api/orders/:orderId/files', upload.array('files', 5), async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const files = req.files;
    
    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, error: '업로드할 파일이 없습니다.' });
    }
    
    const uploadedFiles = [];
    
    for (const file of files) {
      const result = await pool.query(
        \`INSERT INTO photos (order_id, file_name, file_path, file_size, photo_type, description)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *\`,
        [orderId, file.originalname, file.path, file.size, 'order', req.body.description || '']
      );
      
      uploadedFiles.push({
        id: result.rows[0].id,
        filename: file.originalname,
        path: file.path,
        size: file.size
      });
    }
    
    console.log(\`주문 \${orderId}에 \${files.length}개 파일 업로드 완료\`);
    res.json({ 
      success: true, 
      message: \`\${files.length}개 파일이 성공적으로 업로드되었습니다.\`,
      files: uploadedFiles 
    });
    
  } catch (error) {
    console.error('파일 업로드 오류:', error);
    res.status(500).json({ success: false, error: '파일 업로드에 실패했습니다.' });
  }
});

// 도면 파일 업로드
app.post('/api/orders/:orderId/drawings', upload.array('drawings', 3), async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const files = req.files;
    
    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, error: '업로드할 도면이 없습니다.' });
    }
    
    const uploadedDrawings = [];
    
    for (const file of files) {
      const result = await pool.query(
        \`INSERT INTO drawings (order_id, file_name, file_path, file_size, drawing_type, description)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *\`,
        [orderId, file.originalname, file.path, file.size, 'design', req.body.description || '']
      );
      
      uploadedDrawings.push({
        id: result.rows[0].id,
        filename: file.originalname,
        path: file.path,
        size: file.size
      });
    }
    
    console.log(\`주문 \${orderId}에 \${files.length}개 도면 업로드 완료\`);
    res.json({ 
      success: true, 
      message: \`\${files.length}개 도면이 성공적으로 업로드되었습니다.\`,
      drawings: uploadedDrawings 
    });
    
  } catch (error) {
    console.error('도면 업로드 오류:', error);
    res.status(500).json({ success: false, error: '도면 업로드에 실패했습니다.' });
  }
});

// 파일 목록 조회
app.get('/api/orders/:orderId/files', async (req, res) => {
  try {
    const orderId = req.params.orderId;
    
    const photos = await pool.query(
      'SELECT * FROM photos WHERE order_id = $1 ORDER BY upload_date DESC',
      [orderId]
    );
    
    const drawings = await pool.query(
      'SELECT * FROM drawings WHERE order_id = $1 ORDER BY upload_date DESC',
      [orderId]
    );
    
    res.json({
      success: true,
      photos: photos.rows,
      drawings: drawings.rows
    });
    
  } catch (error) {
    console.error('파일 목록 조회 오류:', error);
    res.status(500).json({ success: false, error: '파일 목록을 불러오지 못했습니다.' });
  }
});

// 파일 다운로드
app.get('/api/files/:fileId/download', async (req, res) => {
  try {
    const fileId = req.params.fileId;
    
    // photos 테이블에서 먼저 찾기
    let fileInfo = await pool.query('SELECT * FROM photos WHERE id = $1', [fileId]);
    
    if (fileInfo.rows.length === 0) {
      // drawings 테이블에서 찾기
      fileInfo = await pool.query('SELECT * FROM drawings WHERE id = $1', [fileId]);
    }
    
    if (fileInfo.rows.length === 0) {
      return res.status(404).json({ success: false, error: '파일을 찾을 수 없습니다.' });
    }
    
    const file = fileInfo.rows[0];
    const filePath = path.resolve(file.file_path);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: '파일이 존재하지 않습니다.' });
    }
    
    res.download(filePath, file.file_name);
    
  } catch (error) {
    console.error('파일 다운로드 오류:', error);
    res.status(500).json({ success: false, error: '파일 다운로드에 실패했습니다.' });
  }
});

// 파일 삭제
app.delete('/api/files/:fileId', async (req, res) => {
  try {
    const fileId = req.params.fileId;
    
    // photos 테이블에서 먼저 찾기
    let fileInfo = await pool.query('SELECT * FROM photos WHERE id = $1', [fileId]);
    let tableName = 'photos';
    
    if (fileInfo.rows.length === 0) {
      // drawings 테이블에서 찾기
      fileInfo = await pool.query('SELECT * FROM drawings WHERE id = $1', [fileId]);
      tableName = 'drawings';
    }
    
    if (fileInfo.rows.length === 0) {
      return res.status(404).json({ success: false, error: '파일을 찾을 수 없습니다.' });
    }
    
    const file = fileInfo.rows[0];
    
    // 파일 시스템에서 삭제
    if (fs.existsSync(file.file_path)) {
      fs.unlinkSync(file.file_path);
    }
    
    // 데이터베이스에서 삭제
    await pool.query(\`DELETE FROM \${tableName} WHERE id = $1\`, [fileId]);
    
    res.json({ success: true, message: '파일이 성공적으로 삭제되었습니다.' });
    
  } catch (error) {
    console.error('파일 삭제 오류:', error);
    res.status(500).json({ success: false, error: '파일 삭제에 실패했습니다.' });
  }
});

// 정적 파일 서빙 (업로드된 파일 접근용)
app.use('/uploads', express.static('uploads'));

`;

    // 5. app.js에 코드 추가
    if (!appContent.includes('const multer = require')) {
        // require 구문들 뒤에 multer 설정 추가
        const requireEnd = appContent.lastIndexOf("require(");
        const lineEnd = appContent.indexOf('\n', requireEnd);

        appContent = appContent.slice(0, lineEnd + 1) + multerSetup + appContent.slice(lineEnd + 1);
        console.log('✅ Multer 설정 추가');
    }

    if (!appContent.includes('/api/orders/:orderId/files')) {
        // API 라우트들 앞에 파일 업로드 API 추가
        const apiStart = appContent.indexOf('app.get(\'/api');
        appContent = appContent.slice(0, apiStart) + fileUploadAPIs + '\n' + appContent.slice(apiStart);
        console.log('✅ 파일 업로드 API 추가');
    }

    // 6. 백업 후 저장
    fs.writeFileSync('./app.js.backup', fs.readFileSync(appPath, 'utf8'));
    console.log('✅ app.js 백업 완료');

    fs.writeFileSync(appPath, appContent);
    console.log('✅ app.js 파일 업로드 기능 추가 완료');

    // 7. 프론트엔드 파일 업로드 HTML 추가
    const fileUploadHTML = `
<!-- 파일 업로드 컴포넌트 -->
<div class="file-upload-section" style="margin-top: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
  <h4>📁 파일 첨부</h4>
  
  <div class="upload-area" style="margin: 10px 0;">
    <label for="file-upload" style="display: block; margin-bottom: 5px;">주문서 및 참고 자료:</label>
    <input type="file" id="file-upload" multiple accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx" 
           style="margin-bottom: 10px;">
    <button type="button" onclick="uploadFiles('files')" class="btn btn-secondary">
      📁 파일 업로드
    </button>
  </div>
  
  <div class="upload-area" style="margin: 10px 0;">
    <label for="drawing-upload" style="display: block; margin-bottom: 5px;">설계도면:</label>
    <input type="file" id="drawing-upload" multiple accept=".jpg,.jpeg,.png,.pdf,.svg" 
           style="margin-bottom: 10px;">
    <button type="button" onclick="uploadFiles('drawings')" class="btn btn-secondary">
      📐 도면 업로드
    </button>
  </div>
  
  <div id="upload-progress" style="display: none;">
    <div style="background-color: #f0f0f0; border-radius: 10px; overflow: hidden; margin: 10px 0;">
      <div id="progress-bar" style="background-color: #007bff; height: 20px; width: 0%; transition: width 0.3s;"></div>
    </div>
    <p id="progress-text">업로드 중...</p>
  </div>
  
  <div id="uploaded-files" style="margin-top: 15px;">
    <h5>📋 업로드된 파일 목록</h5>
    <div id="files-list"></div>
  </div>
</div>

<script>
// 파일 업로드 함수
function uploadFiles(type) {
  const fileInput = type === 'drawings' ? 
    document.getElementById('drawing-upload') : 
    document.getElementById('file-upload');
  
  const files = fileInput.files;
  if (files.length === 0) {
    alert('업로드할 파일을 선택해주세요.');
    return;
  }
  
  // 현재 선택된 주문 ID 가져오기 (수정 모드인 경우)
  const orderId = getCurrentOrderId(); // 이 함수는 별도 구현 필요
  if (!orderId) {
    alert('먼저 주문을 저장한 후 파일을 업로드해주세요.');
    return;
  }
  
  const formData = new FormData();
  for (let i = 0; i < files.length; i++) {
    formData.append(type === 'drawings' ? 'drawings' : 'files', files[i]);
  }
  
  // 진행률 표시
  const progressDiv = document.getElementById('upload-progress');
  const progressBar = document.getElementById('progress-bar');
  const progressText = document.getElementById('progress-text');
  
  progressDiv.style.display = 'block';
  progressBar.style.width = '0%';
  progressText.textContent = '업로드 중...';
  
  const endpoint = type === 'drawings' ? 
    \`/api/orders/\${orderId}/drawings\` : 
    \`/api/orders/\${orderId}/files\`;
  
  fetch(endpoint, {
    method: 'POST',
    body: formData
  })
  .then(response => response.json())
  .then(data => {
    progressBar.style.width = '100%';
    
    if (data.success) {
      progressText.textContent = data.message;
      alert(data.message);
      
      // 파일 입력 초기화
      fileInput.value = '';
      
      // 파일 목록 새로고침
      loadUploadedFiles(orderId);
      
      setTimeout(() => {
        progressDiv.style.display = 'none';
      }, 2000);
    } else {
      progressText.textContent = '업로드 실패: ' + data.error;
      alert('업로드 실패: ' + data.error);
    }
  })
  .catch(error => {
    console.error('업로드 오류:', error);
    progressText.textContent = '업로드 중 오류가 발생했습니다.';
    alert('업로드 중 오류가 발생했습니다.');
  });
}

// 업로드된 파일 목록 로드
function loadUploadedFiles(orderId) {
  fetch(\`/api/orders/\${orderId}/files\`)
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      const filesList = document.getElementById('files-list');
      let html = '';
      
      if (data.photos.length > 0) {
        html += '<h6>📷 주문 관련 파일:</h6><ul>';
        data.photos.forEach(file => {
          html += \`
            <li style="margin: 5px 0;">
              <span>\${file.file_name}</span> 
              <small>(\${(file.file_size / 1024).toFixed(1)}KB)</small>
              <button onclick="downloadFile(\${file.id})" class="btn btn-sm btn-outline-primary">다운로드</button>
              <button onclick="deleteFile(\${file.id})" class="btn btn-sm btn-outline-danger">삭제</button>
            </li>
          \`;
        });
        html += '</ul>';
      }
      
      if (data.drawings.length > 0) {
        html += '<h6>📐 설계도면:</h6><ul>';
        data.drawings.forEach(file => {
          html += \`
            <li style="margin: 5px 0;">
              <span>\${file.file_name}</span> 
              <small>(\${(file.file_size / 1024).toFixed(1)}KB)</small>
              <button onclick="downloadFile(\${file.id})" class="btn btn-sm btn-outline-primary">다운로드</button>
              <button onclick="deleteFile(\${file.id})" class="btn btn-sm btn-outline-danger">삭제</button>
            </li>
          \`;
        });
        html += '</ul>';
      }
      
      if (html === '') {
        html = '<p style="color: #666;">업로드된 파일이 없습니다.</p>';
      }
      
      filesList.innerHTML = html;
    }
  })
  .catch(error => {
    console.error('파일 목록 로드 오류:', error);
  });
}

// 파일 다운로드
function downloadFile(fileId) {
  window.open(\`/api/files/\${fileId}/download\`, '_blank');
}

// 파일 삭제
function deleteFile(fileId) {
  if (confirm('정말로 이 파일을 삭제하시겠습니까?')) {
    fetch(\`/api/files/\${fileId}\`, {
      method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        alert('파일이 삭제되었습니다.');
        // 현재 주문 ID로 파일 목록 새로고침
        const orderId = getCurrentOrderId();
        if (orderId) {
          loadUploadedFiles(orderId);
        }
      } else {
        alert('파일 삭제 실패: ' + data.error);
      }
    })
    .catch(error => {
      console.error('파일 삭제 오류:', error);
      alert('파일 삭제 중 오류가 발생했습니다.');
    });
  }
}

// 현재 주문 ID 가져오기 (이 함수는 기존 코드에 맞게 수정 필요)
function getCurrentOrderId() {
  // 여기서 현재 편집 중인 주문의 ID를 반환해야 함
  // 기존 코드의 구조에 따라 수정 필요
  return null; // 임시
}
</script>
`;

    console.log('\n📋 추가된 기능:');
    console.log('  ✓ 멀터 파일 업로드 미들웨어');
    console.log('  ✓ 파일 타입 검증 (이미지, PDF, 문서)');
    console.log('  ✓ 파일 크기 제한 (10MB)');
    console.log('  ✓ 주문별 파일 업로드 API');
    console.log('  ✓ 도면 전용 업로드 API');
    console.log('  ✓ 파일 다운로드 API');
    console.log('  ✓ 파일 삭제 API');
    console.log('  ✓ 업로드 디렉토리 자동 생성');

    console.log('\n🔄 다음 단계:');
    console.log('  1. npm install multer 실행');
    console.log('  2. 서버 재시작');
    console.log('  3. 주문 상세 페이지에 파일 업로드 컴포넌트 추가');

    console.log('\n🎉 파일 업로드 시스템 추가 완료!');
}

try {
    addFileUploadSystem();
} catch (error) {
    console.error('❌ 파일 업로드 시스템 추가 실패:', error);
}
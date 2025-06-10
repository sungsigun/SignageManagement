// fix-port.js - 포트 충돌 해결
const fs = require('fs');

function fixPortConflict() {
  console.log('🔧 포트 충돌 해결 시작...');
  
  try {
    // app.js 파일 읽기
    const appPath = './app.js';
    let appContent = fs.readFileSync(appPath, 'utf8');
    
    // 현재 포트 설정 찾기
    const portRegex = /(const\s+PORT\s*=\s*process\.env\.PORT\s*\|\|\s*)(\d+)/;
    const match = appContent.match(portRegex);
    
    if (match) {
      const currentPort = match[2];
      const newPort = parseInt(currentPort) + 1;
      
      console.log(`📊 현재 포트: ${currentPort}`);
      console.log(`📊 새 포트: ${newPort}`);
      
      // 포트 번호 변경
      const newContent = appContent.replace(portRegex, `$1${newPort}`);
      
      // 파일 백업
      fs.writeFileSync('./app.js.backup', appContent);
      console.log('✅ app.js 백업 완료');
      
      // 새 내용 저장
      fs.writeFileSync(appPath, newContent);
      console.log(`✅ 포트를 ${currentPort}에서 ${newPort}로 변경 완료`);
      
      console.log('\n🚀 변경 완료! 이제 서버를 시작하세요:');
      console.log('  npm run dev');
      console.log(`\n🌐 브라우저에서 접속: http://localhost:${newPort}`);
      
    } else {
      console.log('⚠️  포트 설정을 찾을 수 없습니다.');
      console.log('💡 수동으로 app.js에서 포트를 변경해주세요.');
      
      // 포트 설정 추가
      const portSetting = `
const PORT = process.env.PORT || 3003;
`;
      
      // express 설정 뒤에 포트 설정 추가
      if (appContent.includes('const express = require')) {
        const expressLine = appContent.indexOf('const express = require');
        const nextLineStart = appContent.indexOf('\n', expressLine) + 1;
        
        const newContent = appContent.slice(0, nextLineStart) + 
                          portSetting + 
                          appContent.slice(nextLineStart);
        
        // listen 부분 수정
        const listenRegex = /app\.listen\((\d+)/;
        const finalContent = newContent.replace(listenRegex, 'app.listen(PORT');
        
        fs.writeFileSync('./app.js.backup', appContent);
        fs.writeFileSync(appPath, finalContent);
        
        console.log('✅ 포트 설정 추가 완료 (포트: 3003)');
      }
    }
    
  } catch (error) {
    console.error('❌ 포트 변경 실패:', error.message);
    
    console.log('\n🔧 수동 해결 방법:');
    console.log('1. app.js 파일 열기');
    console.log('2. "const PORT = process.env.PORT || 3002" 찾기');
    console.log('3. 3002를 3003으로 변경');
    console.log('4. 파일 저장 후 npm run dev 실행');
  }
}

// 현재 사용 중인 포트들 확인
function checkPortUsage() {
  console.log('🔍 포트 사용 현황 확인...');
  console.log('💡 Windows에서 포트 확인 명령어:');
  console.log('  netstat -ano | findstr :3002');
  console.log('  netstat -ano | findstr :3003');
  console.log('  netstat -ano | findstr :3004');
  
  console.log('\n🔧 프로세스 강제 종료 방법:');
  console.log('1. 위 명령어로 PID 확인');
  console.log('2. taskkill /PID [PID번호] /F');
  
  console.log('\n🚀 권장 해결 순서:');
  console.log('1. 현재 터미널에서 Ctrl+C로 서버 종료');
  console.log('2. 5초 대기 후 npm run dev 재실행');
  console.log('3. 여전히 안 되면 포트 변경');
}

console.log('🔧 포트 충돌 해결 도구');
console.log('====================');

checkPortUsage();
console.log('');
fixPortConflict();
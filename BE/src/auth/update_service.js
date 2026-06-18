const fs = require('fs');
let p = 'src/auth/auth.service.ts';
let c = fs.readFileSync(p, 'utf8');

c = c.replace(/'Ngu?i dùng không t?n t?i'/g, 'ResponseMessages.AUTH.USER_NOT_FOUND');
c = c.replace(/'M?t kh?u hi?n t?i không dúng'/g, 'ResponseMessages.AUTH.CURRENT_PASSWORD_INCORRECT');
c = c.replace(/'Ð?i m?t kh?u thành công'/g, 'ResponseMessages.AUTH.PASSWORD_CHANGED_SUCCESS');
c = c.replace(/'B?n dã d?i m?t kh?u r?i'/g, 'ResponseMessages.AUTH.PASSWORD_HAVE_BEEN_CHANGED');
c = c.replace(/'M?t kh?u ph?i có ít nh?t 6 ký t?'/g, 'ResponseMessages.AUTH.PASSWORD_TOO_SHORT');
c = c.replace(/'M?t kh?u m?i ph?i khác m?t kh?u cu'/g, 'ResponseMessages.AUTH.PASSWORD_MUST_BE_DIFFERENT');
c = c.replace(/'Device không t?n t?i'/g, 'ResponseMessages.AUTH.DEVICE_NOT_FOUND');
c = c.replace(/'Device dã du?c logout tru?c dó'/g, 'ResponseMessages.AUTH.DEVICE_ALREADY_LOGGED_OUT');
c = c.replace(/'Ðã logout thi?t b? hi?n t?i'/g, 'ResponseMessages.AUTH.DEVICE_LOGGED_OUT');

// Check there are no left overs
console.log('remaining single quotes:');
const matches = c.match(/'[^']*'/g);
if (matches) {
     matches.filter(m => /Thành công|L?i|M?t kh?u|Không/.test(m)).forEach(v => console.log(v));
}

fs.writeFileSync(p, c);

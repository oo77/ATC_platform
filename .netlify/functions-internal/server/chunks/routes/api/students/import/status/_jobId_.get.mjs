import { d as defineEventHandler, a as getRouterParam } from '../../../../../nitro/nitro.mjs';
import { b as getImportJobStatus } from '../../../../../_/importUtils.mjs';
import 'grammy';
import 'uuid';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'mysql2/promise';
import 'bcryptjs';
import 'crypto';
import 'jsonwebtoken';
import 'module';
import '../../../../../_/studentRepository.mjs';

const _jobId__get = defineEventHandler((event) => {
  const jobId = getRouterParam(event, "jobId");
  if (!jobId) {
    return {
      success: false,
      error: "Job ID \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D"
    };
  }
  const status = getImportJobStatus(jobId);
  if (!status) {
    return {
      success: false,
      error: "\u0417\u0430\u0434\u0430\u0447\u0430 \u0438\u043C\u043F\u043E\u0440\u0442\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430"
    };
  }
  return {
    success: true,
    status
  };
});

export { _jobId__get as default };
//# sourceMappingURL=_jobId_.get.mjs.map

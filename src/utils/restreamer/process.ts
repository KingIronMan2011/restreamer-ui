import { anonymize } from '../anonymizer';

type Call = (method: any, ...args: any[]) => Promise<any[]>;
type ProcessApi = Record<string, any>;
type SanitizeProcess = (process: any) => any;

export async function listProcesses(
  api: ProcessApi,
  call: Call,
  sanitize: SanitizeProcess,
  filter: string[],
  reference: string,
  ids: string[],
) {
  const [processes, error] = await call(api.Processes, reference, ids, filter);
  if (error !== null) return [];

  return processes.map(sanitize);
}

export async function getProcess(
  api: ProcessApi,
  call: Call,
  sanitize: SanitizeProcess,
  id: string,
  filter: string[],
) {
  const [process, error] = await call(api.Process, id, filter);
  return error !== null ? null : sanitize(process);
}

export async function getProcessConfig(
  api: ProcessApi,
  call: Call,
  id: string,
) {
  const [value, error] = await call(api.ProcessConfig, id);
  return error !== null ? null : value;
}

export async function getProcessState(api: ProcessApi, call: Call, id: string) {
  const [value, error] = await call(api.ProcessState, id);
  return error !== null ? null : value;
}

export async function getProcessLog(api: ProcessApi, call: Call, id: string) {
  const [value, error] = await call(api.ProcessReport, id);
  return error !== null ? null : value;
}

export async function getProcessDebug(api: ProcessApi, call: Call, id: string) {
  const [process, error] = await call(api.Process, id, [
    'config',
    'state',
    'report',
  ]);
  if (error !== null) return null;

  if (process.config) {
    process.config.options = process.config.options.map(anonymize);

    for (const input of process.config.input) {
      input.address = anonymize(input.address);
      input.options = input.options.map(anonymize);
    }

    for (const output of process.config.output) {
      output.address = anonymize(output.address);
      output.options = output.options.map(anonymize);
    }
  }

  if (process.state) {
    for (const input of process.state.progress.inputs) {
      input.address = anonymize(input.address);
    }

    for (const output of process.state.progress.outputs) {
      output.address = anonymize(output.address);
    }

    if (!process.state.command) process.state.command = [];
    process.state.command = process.state.command.map(anonymize);
    process.state.last_logline = anonymize(process.state.last_logline);
  }

  if (process.report) {
    if (!process.report.prelude) process.report.prelude = [];
    process.report.prelude = process.report.prelude.map(anonymize);
    process.report.log = process.report.log.map((line: any) => [
      line[0],
      anonymize(line[1]),
    ]);

    for (const history of process.report.history) {
      history.prelude = history.prelude.map(anonymize);
      history.log = history.log.map((line: any) => [
        line[0],
        anonymize(line[1]),
      ]);
    }
  }

  return process;
}

export async function startProcess(api: ProcessApi, call: Call, id: string) {
  const [, error] = await call(api.ProcessCommand, id, 'start');
  return error === null;
}

export async function stopProcess(api: ProcessApi, call: Call, id: string) {
  const [, error] = await call(api.ProcessCommand, id, 'stop');
  return error === null;
}

export async function upsertProcess(
  api: ProcessApi,
  call: Call,
  id: string,
  config: any,
) {
  const [value, error] = await call(api.ProcessUpdate, id, config);
  if (error?.code === 404) return await call(api.ProcessAdd, config);
  return [value, error];
}

export async function deleteProcess(api: ProcessApi, call: Call, id: string) {
  const [, error] = await call(api.ProcessDelete, id);
  return error === null || error.code === 404;
}

export async function setProcessMetadata(
  api: ProcessApi,
  call: Call,
  id: string,
  data: any,
) {
  const [, error] = await call(
    api.ProcessSetMetadata,
    id,
    'restreamer-ui',
    data,
  );
  return error === null;
}

export async function getProcessMetadata(
  api: ProcessApi,
  call: Call,
  id: string,
) {
  const [value, error] = await call(
    api.ProcessGetMetadata,
    id,
    'restreamer-ui',
  );
  return error !== null ? null : value;
}

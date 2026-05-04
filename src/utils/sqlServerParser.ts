export function parseSqlServer(rawServer: string) {

   const serverValue = (rawServer || '').trim();

   const result: {
      server: string;
      port?: number;
      instanceName?: string;
   } = {
      server: serverValue
   };

   // Exemplo: 140.2.254.15,1434
   if (serverValue.includes(',')) {
      const [host, port] = serverValue.split(',');

      result.server = host.trim();

      const parsedPort = Number(port?.trim());

      if (!isNaN(parsedPort)) {
         result.port = parsedPort;
      }

      return result;
   }

   // Exemplo: localhost\SQLEXPRESS
   if (serverValue.includes('\\')) {
      const [host, instanceName] = serverValue.split('\\');

      result.server = host.trim();
      result.instanceName = instanceName.trim();

      return result;
   }

   return result;
}
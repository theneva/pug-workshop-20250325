import * as pulumi from '@pulumi/pulumi';
import { getStack, StackReference } from '@pulumi/pulumi';
import * as kubernetes from '@pulumi/kubernetes';

const env = getStack();

const config = new pulumi.Config();
const title = config.require('nginxTitle');
const body = config.require('nginxBody');

const kubeconfig = new StackReference('kubeconfig', {
  name: `theneva/pug-cluster/${env}`,
}).requireOutput('kubeconfig');

const doK8SProvider = new kubernetes.Provider('do_k8s_provider', {
  enableServerSideApply: true,
  kubeconfig,
});

const nginxConfigMap = new kubernetes.core.v1.ConfigMap(
  'nginxConfigMap',
  {
    metadata: {
      name: 'nginx-config',
    },
    data: {
      'index.html': `<!DOCTYPE html>
    <html>
    <head>
        <title>${title}</title>
    </head>
    <body>
        <h1>${body}</h1>
    </body>
    </html>
    `,
    },
  },
  { provider: doK8SProvider },
);

const nginxDeployment = new kubernetes.apps.v1.Deployment(
  'nginxDeployment',
  {
    metadata: {
      annotations: { 'reloader.stakater.com/auto': 'true' },
      name: 'nginx-deployment',
    },
    spec: {
      replicas: 1,
      selector: { matchLabels: { app: 'nginx' } },
      template: {
        metadata: { labels: { app: 'nginx' } },
        spec: {
          containers: [
            {
              name: 'nginx',
              image: 'nginx:latest',
              ports: [{ containerPort: 80 }],
              volumeMounts: [
                {
                  name: 'nginx-html',
                  mountPath: '/usr/share/nginx/html/index.html',
                  subPath: 'index.html',
                },
              ],
            },
          ],
          volumes: [
            {
              name: 'nginx-html',
              configMap: {
                name: 'nginx-config',
                items: [{ key: 'index.html', path: 'index.html' }],
              },
            },
          ],
        },
      },
    },
  },
  { provider: doK8SProvider },
);
const nginxService = new kubernetes.core.v1.Service(
  'nginxService',
  {
    metadata: {
      name: 'nginx-service',
    },
    spec: {
      selector: { app: 'nginx' },
      type: kubernetes.core.v1.ServiceSpecType.LoadBalancer,
      ports: [{ port: 8080, targetPort: 80 }],
    },
  },
  { provider: doK8SProvider },
);

export const serviceName = nginxService.metadata.apply(
  (metadata) => metadata.name,
);
export const loadBalancer = nginxService.status.loadBalancer;

const reloader = new kubernetes.helm.v3.Release(
  'nginx-app-reloader',
  {
    chart: 'reloader',
    repositoryOpts: { repo: 'https://stakater.github.io/stakater-charts' },
  },
  { provider: doK8SProvider },
);

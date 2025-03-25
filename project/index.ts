import * as digitalocean from "@pulumi/digitalocean";
import {Config, getStack} from "@pulumi/pulumi";

const env = getStack();
const config = new Config()

const doCluster = new digitalocean.KubernetesCluster("do-cluster", {
  name: `martin-pug-oslo-${env}`,
  region: config.require('region'),
  version: "1.32.2-do.0",
  destroyAllAssociatedResources: true,
  tags: [getStack(), 'typescript'],
  nodePool: {
    name: "default",
    size: "s-2vcpu-2gb",
    nodeCount: config.requireNumber('nodeCount'),
  },
});
export const name = doCluster.name;
export const kubeconfig = doCluster.kubeConfigs.apply(kubeConfigs => kubeConfigs[0].rawConfig);


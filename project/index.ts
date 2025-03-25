import * as digitalocean from "@pulumi/digitalocean";
import {Config, getStack} from "@pulumi/pulumi";

const env = getStack();
const config = new Config()

const region = config.require('region');
const nodePoolName = "default";
const nodeCount =config.requireNumber('nodeCount')
const version = "1.32.2-do.0";

const doCluster = new digitalocean.KubernetesCluster("do-cluster", {
  name: `martin-pug-oslo-${env}`,
  region,
  version,
  destroyAllAssociatedResources: true,
  tags: [getStack(), 'typescript'],
  nodePool: {
    name: nodePoolName,
    size: "s-2vcpu-2gb",
    nodeCount,
  },
});
export const { name } = doCluster;
export const kubeconfig = doCluster.kubeConfigs.apply(kubeConfigs => kubeConfigs[0].rawConfig);


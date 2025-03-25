import * as digitalocean from "@pulumi/digitalocean";

const doCluster = new digitalocean.KubernetesCluster("do-cluster", {
  name: 'martin-pug-oslo',
  region: "fra1",
  version: "1.32.2-do.0",
  destroyAllAssociatedResources: true,
  nodePool: {
    name: "default",
    size: "s-2vcpu-2gb",
    nodeCount: 1,
  },
});
export const name = doCluster.name;
export const kubeconfig = doCluster.kubeConfigs.apply(kubeConfigs => kubeConfigs[0].rawConfig);


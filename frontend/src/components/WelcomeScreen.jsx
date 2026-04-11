const CARDS = [
  {
    icon: '🐳',
    title: 'Dockerfile',
    sub: 'Multi-stage builds, layer caching',
    query: 'Write an optimized multi-stage Dockerfile for a Node.js production app',
  },
  {
    icon: '⚡',
    title: 'CI/CD Pipeline',
    sub: 'GitHub Actions, Jenkins, GitLab',
    query: 'Create a full GitHub Actions workflow: build, test, scan, and deploy to EKS',
  },
  {
    icon: '☸',
    title: 'K8s Manifests',
    sub: 'Deployments, Services, Ingress',
    query: 'Kubernetes deployment YAML with HPA, PDB, resource limits, and rolling update',
  },
  {
    icon: '🏗',
    title: 'Infrastructure',
    sub: 'Terraform, CloudFormation, Pulumi',
    query: 'Terraform modules for AWS: VPC, ECS cluster, RDS, and ALB with best practices',
  },
];

export function WelcomeScreen({ onSelect }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 text-center px-5 py-10 gap-4">
      <div className="w-16 h-16 bg-gray-900 border border-gray-700 rounded-2xl flex items-center justify-center text-3xl">
        ⚙
      </div>
      <h2 className="text-xl font-semibold text-gray-100 font-mono">DevOps Assistant</h2>
      <p className="text-sm text-gray-400 max-w-md leading-relaxed">
        Expert help with CI/CD pipelines, Docker, Kubernetes, cloud platforms, Infrastructure as Code, and monitoring.
        I generate working YAML, Dockerfiles, Bash scripts, and Terraform configs.
      </p>
      <div className="grid grid-cols-2 gap-2 mt-2 w-full max-w-lg">
        {CARDS.map(({ icon, title, sub, query }) => (
          <button
            key={title}
            onClick={() => onSelect(query)}
            className="bg-gray-900 border border-gray-700 rounded-xl p-3 text-left hover:border-blue-700 hover:bg-gray-800 transition-all"
          >
            <div className="text-sm font-medium text-gray-200 mb-1 font-mono">{icon} {title}</div>
            <div className="text-xs text-gray-500 leading-relaxed">{sub}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default WelcomeScreen;

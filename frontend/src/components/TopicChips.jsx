const TOPICS = [
  { label: '⚡ GitHub Actions', query: 'Show me a complete GitHub Actions CI/CD pipeline for a Node.js app' },
  { label: '🐳 Docker', query: 'Docker best practices: multi-stage builds, security, and optimization' },
  { label: '☸ Kubernetes', query: 'Kubernetes deployment with rolling updates, HPA, and health probes' },
  { label: '🏗 Terraform', query: 'Terraform AWS VPC and ECS cluster with modules best practices' },
  { label: '☁ AWS ECS', query: 'AWS ECS Fargate setup with ALB, auto-scaling, and CloudWatch logging' },
  { label: '📊 Prometheus', query: 'Prometheus and Grafana monitoring stack setup with Docker Compose' },
  { label: '⚓ Helm Charts', query: 'Create a production-ready Helm chart for a microservice' },
  { label: '🔧 Jenkins', query: 'Jenkins declarative pipeline with stages, parallel steps, and agents' },
];

export function TopicChips({ onSelect }) {
  return (
    <div className="w-full flex justify-center pt-8 pb-4">
      <div className="max-w-4xl w-full flex gap-2 px-5 overflow-x-auto scrollbar-none shrink-0">
        {TOPICS.map(({ label, query }) => (
          <button
            key={label}
            onClick={() => onSelect(query)}
            className="flex items-center gap-1 px-4 py-2 bg-transparent border border-gray-800 hover:border-blue-700/50 hover:bg-blue-900/10 rounded-full text-[13px] text-gray-500 hover:text-blue-400 whitespace-nowrap transition-all font-sans font-medium"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default TopicChips;

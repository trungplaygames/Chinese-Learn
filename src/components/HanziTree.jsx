import './HanziTree.css';

const HanziNode = ({ node, isRoot = false }) => {
  return (
    <div className="hanzi-tree-branch">
      <div className={`hanzi-tree-node ${isRoot ? 'root' : ''}`}>
        <div className="node-circle">
          <span className="node-char">{node.name}</span>
        </div>
        {node.label && <span className="node-label">{node.label}</span>}
      </div>
      
      {node.children && node.children.length > 0 && (
        <div className="hanzi-tree-children">
          {node.children.map((child, index) => (
            <HanziNode key={index} node={child} />
          ))}
        </div>
      )}
    </div>
  );
};

export default function HanziTree({ data }) {
  if (!data) return null;
  
  return (
    <div className="hanzi-tree-container">
      <HanziNode node={data} isRoot={true} />
    </div>
  );
}

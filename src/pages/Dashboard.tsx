export default function Dashboard() {
  return (
    <div>
      <h1>Dashboard Page</h1>

      {Array.from({ length: 100 }).map((_, i) => (
        <p key={i}>Item {i}</p>
      ))}
    </div>
  )
}

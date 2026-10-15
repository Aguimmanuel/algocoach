"""Independent Python reference results for the 95 fixed playground presets.

The browser simulates algorithms in JavaScript; it does not execute learner code.
Run: python -m unittest discover -s tests/python -p 'test_playground_examples.py'
"""
import json, heapq, unittest
from pathlib import Path

def reference(id,x):
 a=x.get('values',[]); t=x.get('target',0)
 if id=='brute':
  return next(([i,j] for i in range(len(a)) for j in range(i+1,len(a)) if a[i]+a[j]==t),[-1,-1])
 if id=='hashmap':
  seen={}
  for i,v in enumerate(a):
   if t-v in seen:return [seen[t-v],i]
   seen[v]=i
  return [-1,-1]
 if id=='two-pointers':
  l,r=0,len(a)-1
  while l<r:
   s=a[l]+a[r]
   if s==t:return [l,r]
   if s<t:l+=1
   else:r-=1
  return [-1,-1]
 if id=='sliding-window':return max(sum(a[i:i+x['k']]) for i in range(len(a)-x['k']+1))
 if id=='prefix-sum':return sum(a[x['from']:x['to']+1])
 if id=='binary-search':
  l,r=0,len(a)-1
  while l<=r:
   m=(l+r)//2
   if a[m]==t:return m
   if a[m]<t:l=m+1
   else:r=m-1
  return -1
 if id=='sorting':return sorted(a)
 if id=='linked-list':return a[::-1]
 if id=='stack':
  st=[];p={')':'(',']':'[','}':'{'}
  for c in x['text']:
   if c in p:
    if not st or st.pop()!=p[c]:return False
   else:st.append(c)
  return not st
 if id in ['bfs','dfs']:
  g=x['grid']; R=len(g);C=len(g[0]);seen=set();regions=0
  for r in range(R):
   for c in range(C):
    if g[r][c]=='#' or (r,c) in seen:continue
    if id=='bfs' and (r,c)!=(0,0):continue
    regions+=1; q=[(r,c,0)];seen.add((r,c))
    while q:
     rr,cc,d=q.pop(0)
     if id=='bfs' and g[rr][cc]=='T':return d
     for dr,dc in [(-1,0),(1,0),(0,-1),(0,1)]:
      nr,nc=rr+dr,cc+dc
      if 0<=nr<R and 0<=nc<C and g[nr][nc]!='#' and (nr,nc) not in seen:
       seen.add((nr,nc));q.append((nr,nc,d+1))
  return -1 if id=='bfs' else regions
 if id=='trees':
  tree=x['tree'];out=[]
  def visit(i):
   if i>=len(tree) or tree[i] is None:return
   visit(2*i+1);out.append(tree[i]);visit(2*i+2)
  visit(0);return out
 if id=='backtracking':
  out=[]
  def walk(i,p):
   if i==len(a):out.append(p);return
   walk(i+1,p+[a[i]]);walk(i+1,p)
  walk(0,[]);return out
 if id=='intervals':
  out=[]
  for s,e in sorted(x['intervals']):
   if out and s<=out[-1][1]:out[-1][1]=max(out[-1][1],e)
   else:out.append([s,e])
  return out
 if id=='dp':
  n=x['amount'];dp=[0]+[float('inf')]*n
  for c in x['coins']:
   for i in range(c,n+1):dp[i]=min(dp[i],dp[i-c]+1)
  return -1 if dp[n]==float('inf') else dp[n]
 if id=='greedy':
  out=[];free=0
  for s,e in sorted(x['intervals'],key=lambda p:p[1]):
   if s>=free:out.append([s,e]);free=e
  return out
 if id=='heap':
  h=[]
  for v in a:heapq.heappush(h,v)
  return h
 if id=='union-find':
  n=x['n'];p=list(range(n))
  def find(i):
   while p[i]!=i:i=p[i]
   return i
  for a,b in x['edges']:p[find(a)]=find(b)
  return len({find(i) for i in range(n)})
 if id=='dijkstra':
  nodes=['A','B','C','D','E','F'];d={n:float('inf') for n in nodes};d['A']=0;q=[(0,'A')]
  while q:
   cost,u=heapq.heappop(q)
   if cost>d[u]:continue
   for a,b,w in x['weightedEdges']:
    v=b if a==u else a if b==u else None
    if v and cost+w<d[v]:d[v]=cost+w;heapq.heappush(q,(d[v],v))
  return {k:'∞' if v==float('inf') else v for k,v in d.items()}
 raise ValueError(id)


EXAMPLES=json.loads((Path(__file__).resolve().parents[2]/"src/data/playgroundExamples.json").read_text())
class PlaygroundExamples(unittest.TestCase):
    pass
for pattern,cases in EXAMPLES.items():
    for index,case in enumerate(cases):
        def check(self, pattern=pattern, case=case):
            self.assertEqual(reference(pattern,case["input"]),case["expected"])
        setattr(PlaygroundExamples,f"test_{pattern.replace('-', '_')}_{index+1}",check)
if __name__=="__main__":unittest.main()
